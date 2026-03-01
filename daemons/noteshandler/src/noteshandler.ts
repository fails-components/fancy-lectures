/*
    Fails Components (Fancy Automated Internet Lecture System - Components)
    Copyright (C)  2015-2017 (original FAILS), 
                   2021- (FAILS Components)  Marten Richter <marten.richter@freenet.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { createHash } from 'crypto'
import {
  CommonConnection,
  type NotesIdType,
  type RouterInfo,
  type TokenType
} from '@fails-components/commonhandler'
import { Binary, type Db as MongoDb } from 'mongodb'
import { type RedisClusterType, type RedisClientType } from 'redis'
import type { Namespace } from 'socket.io'
import type { FailsAssets } from '@fails-components/assets'
import type {
  FailsJWTSigner,
  AuthenticatedSocket
} from '@fails-components/security'

type NotesToken = {
  user?: Record<string, any>
  purpose: 'notes'
  lectureuuid: string
  appversion: string
  features: string[]
  name: string
  maxrenew: number
}

export class NotesConnection extends CommonConnection {
  protected mongo: MongoDb
  protected getFileURL: (sha: Binary, mimetype: string) => string
  protected signAvsJwt: FailsJWTSigner['signToken']
  protected redis: RedisClusterType | RedisClientType
  protected notepadio: Namespace
  protected notesio: Namespace
  protected screenio: Namespace
  protected noteshandlerURL: string
  protected signNotesJwt: FailsJWTSigner['signToken']

  constructor(args: {
    redis: RedisClusterType | RedisClientType
    mongo: MongoDb
    getFileURL: FailsAssets['getFileURL']
    noteshandlerURL: string
    signNotesJwt: FailsJWTSigner['signToken']
    signAvsJwt: FailsJWTSigner['signToken']
    notepadio: Namespace
    screenio: Namespace
    notesio: Namespace
  }) {
    super()
    this.redis = args.redis
    this.mongo = args.mongo
    this.notesio = args.notesio
    this.notepadio = args.notepadio
    this.screenio = args.screenio
    this.getFileURL = args.getFileURL

    this.noteshandlerURL = args.noteshandlerURL

    this.signNotesJwt = args.signNotesJwt
    this.signAvsJwt = args.signAvsJwt

    this.SocketHandlerNotes = this.SocketHandlerNotes.bind(this)
  }

  async SocketHandlerNotes(socket: AuthenticatedSocket) {
    const address = socket?.handshake?.headers?.['x-forwarded-for']
      ?.toString()
      ?.split(',')
      .map((el) => el.trim()) || [socket.client.conn.remoteAddress]
    console.log('Notes %s with ip %s  connected', socket.id, address)
    if (!socket.decoded_token) {
      console.log('decoded token invalid')
      socket.disconnect()
      return
    }
    console.log('Notes name', socket.decoded_token.name)
    console.log('Notes lecture uuid', socket.decoded_token.lectureuuid)

    const purenotes: NotesIdType = {
      socketid: socket.id,
      lectureuuid: socket.decoded_token.lectureuuid,
      name: socket.decoded_token.name,
      displayname: socket.decoded_token.user.displayname,
      appversion: socket.decoded_token.appversion,
      features: socket.decoded_token.features,
      purpose: 'notes'
    }

    let curtoken: NotesToken = socket.decoded_token as NotesToken
    let routerurl: Promise<string | undefined> | undefined
    let routerres: ((value: string | undefined) => void) | undefined
    ;({ promise: routerurl, resolve: routerres } = Promise.withResolvers<
      string | undefined
    >())

    // console.log('notes connected')

    this.getLectDetail(purenotes, socket)

    // console.log('notes send board data')
    this.sendBoardsToSocket(purenotes.lectureuuid, socket)
    purenotes.roomname = this.getRoomName(purenotes.lectureuuid)
    {
      const messagehash = createHash('sha256')
      const useruuid = socket.decoded_token.user.useruuid
      // now we create a hash that can be used to identify a user, if and only if,
      // access to this database is available and not between lectures!
      messagehash.update(useruuid + purenotes.lectureuuid)
      purenotes.userhash = messagehash.digest('hex')
    }
    // console.log('notes is connected to notepad, join room', purenotes.roomname)
    socket.join(purenotes.roomname)

    {
      const token = await this.getNotesToken(curtoken)
      if (!token.decoded) {
        console.log('error in sending authtoken', token.error)
        return
      }
      curtoken = token.decoded
      socket.emit('authtoken', { token: token.token })
    }
    socket.emit('userhash', purenotes.userhash)

    {
      const presinfo = this.getPresentationinfo(purenotes)
      const readypresinfo = await presinfo
      socket.emit('presinfo', readypresinfo)
    }
    this.emitAVOffers(socket, purenotes)
    this.emitVideoquestions(socket, purenotes)

    socket.on('reauthor', async () => {
      // we use the information from the already present authtoken
      const token = await this.getNotesToken(curtoken)
      if (!token.decoded) {
        console.log('error in reauthor', token.error)
        return
      }
      curtoken = token.decoded
      const { cryptKey, signKey, userhash } = purenotes
      if (
        typeof cryptKey !== 'string' ||
        typeof signKey !== 'string' ||
        typeof userhash !== 'string'
      ) {
        console.log('error in reauthor , no sign, userhash or crypt key')
        return
      }
      this.addUpdateCryptoIdent({ ...purenotes, cryptKey, signKey, userhash })

      socket.emit('authtoken', { token: token.token })
    })

    socket.on('chatquestion', (cmd) => {
      if (!curtoken) {
        console.log('curtoken not defined in chatquestion')
        return
      }
      if (!purenotes.roomname) {
        console.log('roomname not defined in chatquestion')
        return
      }
      if (cmd.text) {
        const displayname = curtoken.user?.displayname
        const userhash = purenotes.userhash

        this.notepadio.to(purenotes.roomname).emit('chatquestion', {
          displayname,
          text: cmd.text,
          encData: cmd.encData,
          keyindex: cmd.keyindex,
          iv: cmd.iv,
          videoquestion: cmd.videoquestion
            ? { id: purenotes.socketid }
            : undefined,
          userhash
        })

        // console.log("chat send", cmd.text,socket.decoded_token);
      }
      // console.log("chatquestion",cmd);
    })

    socket.on('closevideoquestion', (/*cmd*/) => {
      this.closeVideoQuestion(purenotes, { id: purenotes.socketid }).catch(
        (error) => {
          console.log('Problem in closeVideoQuestion', error)
        }
      )
    })

    socket.on('avoffer', (cmd) => {
      this.handleVQoffer(purenotes, cmd).catch((error) => {
        console.log('Problem in handleVQoffer', error)
      })
    })

    socket.on('castvote', async (data, callback) => {
      if (
        data.pollid &&
        /^[0-9a-zA-Z]{9}$/.test(data.pollid) &&
        data.selection &&
        ((typeof data.selection === 'string' &&
          /^[0-9a-zA-Z]{9}$/.test(data.selection)) ||
          (Array.isArray(data.selection) &&
            data.selection.filter((el: string) => /^[0-9a-zA-Z]{9}$/.test(el))
              .length > 0))
      ) {
        const pollstate = await this.getPollinfo(purenotes)
        if (!pollstate) {
          console.log('get pollinfo in castvote failed')
          callback({ error: 'get pollinfo in castvote failed' })
          return
        }
        if (
          pollstate.limited &&
          !pollstate.participants.includes(purenotes.userhash)
        ) {
          console.log('not eglible to vote!')
          callback({ error: 'not eglible to vote!' })
          return
        }
        if (pollstate.data.id !== data.pollid) {
          callback({ error: 'pollid does not match current running poll!' })
          return
        }
        if (!curtoken) {
          console.log('curtoken not defined in castvote')
          callback({ error: 'curtoken not defined in castvote' })
          return
        }
        const useruuid = curtoken.user?.useruuid
        if (typeof useruuid === 'undefined') {
          console.log('user.useruuid in token invalid')
          socket.disconnect()
          return
        }
        try {
          const ballothash = createHash('sha256')
          ballothash.update(useruuid + data.pollid)

          const salt = await this.redis.get(
            'pollsalt:lecture:{' +
              purenotes.lectureuuid +
              '}:poll:' +
              data.pollid
          )
          if (!salt) {
            throw new Error('Problem in getting polsalt')
          }
          if (!purenotes.roomname) {
            throw new Error('roomname not defined in castvoten')
          }
          ballothash.update(salt)
          const ballotid = ballothash.digest('hex')
          this.notepadio.to(purenotes.roomname).emit('castvote', {
            ballotid: ballotid,
            vote: data.selection,
            pollid: data.pollid
          })
          callback({ ballot: ballotid })
        } catch (err) {
          console.log('failed to get salt', err)
          callback({ error: 'failure' })
        }
      } else callback({ error: 'failure' })
    })
    let rurl: string | undefined

    socket.on('getrouting', async (cmd, callback) => {
      let tempOut
      if (cmd.dir === 'out' && cmd.id === purenotes.socketid) {
        let toid
        try {
          if (typeof rurl === 'undefined' && routerurl)
            rurl = await Promise.any([
              routerurl,
              new Promise<undefined>((resolve, reject) => {
                toid = setTimeout(reject, 20 * 1000)
              })
            ])
          if (toid) clearTimeout(toid)
          if (typeof rurl === 'undefined') {
            throw new Error('Unknown routerurl')
          }
          toid = undefined
          tempOut = await this.getTempOutTransport(purenotes, rurl)
        } catch (error) {
          callback({ error: 'getrouting: timeout or error tempout: ' + error })
        }
      }

      if (
        cmd &&
        cmd.id &&
        cmd.dir &&
        (cmd.dir === 'in' || tempOut) /* || cmd.dir === 'out' */ // a notes can only receive, later with special permission
      ) {
        try {
          let toid
          if (typeof rurl === 'undefined' && routerurl)
            rurl = await Promise.any([
              routerurl,
              new Promise<undefined>((resolve, reject) => {
                toid = setTimeout(reject, 20 * 1000)
              })
            ])
          if (toid) clearTimeout(toid)
          if (typeof rurl === 'undefined') {
            throw new Error('Unknown routerurl')
          }
          toid = undefined
          await this.getRouting(purenotes, { ...cmd, tempOut }, rurl, callback)
        } catch (error) {
          callback({ error: 'getrouting: timeout or error: ' + error })
        }
      } else callback({ error: 'getrouting: malformed request' })
    })

    socket.on('gettransportinfo', (cmd, callback) => {
      let geopos
      if (cmd && cmd.geopos && cmd.geopos.longitude && cmd.geopos.latitude)
        geopos = {
          longitude: cmd.geopos.longitude,
          latitude: cmd.geopos.latitude
        }
      this.getTransportInfo(
        {
          ipaddress: address,
          geopos,
          lectureuuid: purenotes.lectureuuid,
          clientid: socket.id,
          canWrite: false
        },
        (ret) => {
          if (ret.url) {
            if (routerres) {
              const res = routerres
              routerres = undefined
              res(ret.url)
            }
            rurl = ret.url
          } else routerurl = undefined
          callback(ret)
        }
      ).catch((error) => {
        console.log('Problem in getTransportInfo', error)
      })
    })

    socket.on('keyInfo', (cmd) => {
      if (cmd.cryptKey && cmd.signKey) {
        purenotes.cryptKey = cmd.cryptKey
        purenotes.signKey = cmd.signKey
        this.addUpdateCryptoIdent(
          purenotes as typeof purenotes & {
            signKey: string
            cryptKey: string
            userhash: string
          }
        )
      }
    })

    socket.on('keymasterQuery', () => {
      if (purenotes.cryptKey && purenotes.signKey) {
        this.handleKeymasterQuery(
          purenotes as typeof purenotes & {
            signKey: string
            cryptKey: string
            userhash: string
          }
        )
      }
    })

    socket.on('disconnect', async () => {
      console.log(
        'Notes Client %s with ip %s  disconnected',
        socket.id,
        address
      )
      if (purenotes) {
        if (purenotes.roomname) {
          socket.leave(purenotes.roomname)
          try {
            const proms = []
            proms.push(
              this.redis.hDel(
                'lecture:{' + purenotes.lectureuuid + '}:idents',
                purenotes.socketid
              )
            )
            proms.push(
              this.redis.hDel(
                'lecture:{' + purenotes.lectureuuid + '}:videoquestion',
                'permitted:' + purenotes.socketid
              )
            )
            this.notepadio
              .to(purenotes.roomname)
              .emit('identDelete', { id: purenotes.socketid })

            const promres = await Promise.all(proms)
            if (promres[1] > 0) {
              this.notepadio
                .to(purenotes.roomname)
                .emit('closevideoquestion', { id: purenotes.socketid })
              this.screenio
                .to(purenotes.roomname)
                .emit('closevideoquestion', { id: purenotes.socketid })
              this.notesio
                .to(purenotes.roomname)
                .emit('closevideoquestion', { id: purenotes.socketid })
            }
          } catch (error) {
            console.log('Problem disconnect:', error)
          }
          // console.log('notes disconnected leave room', purenotes.roomname)
          purenotes.roomname = undefined
        }
      }
    })

    {
      const pollstate = await this.getPollinfo(purenotes)
      if (pollstate) {
        let canVote = true
        if (pollstate.limited) {
          if (!pollstate.participants.includes(purenotes.userhash)) {
            canVote = false
          }
        }
        socket.emit(pollstate.command, { ...pollstate.data, canVote })
      }
    }
  }

  async getNotesToken(oldtoken: NotesToken): Promise<{
    token?: string
    decoded?: NotesToken
    oldtoken?: NotesToken
    error?: string
  }> {
    const newtoken = {
      lectureuuid: oldtoken.lectureuuid,
      purpose: 'notes' as const, // in case a bug is there, no one should escape the realm
      name: oldtoken.name,
      user: oldtoken.user,
      appversion: oldtoken.appversion,
      features: oldtoken.features,
      noteshandler: this.noteshandlerURL,
      maxrenew: oldtoken.maxrenew - 1
    }
    if (!oldtoken.maxrenew || !(oldtoken.maxrenew > 0))
      return { error: 'maxrenew token failed', oldtoken: oldtoken }
    return { token: await this.signNotesJwt(newtoken), decoded: newtoken }
  }

  async getTempOutTransport(
    args: {
      lectureuuid: string
      socketid: string
    },
    routerurl: string
  ) {
    try {
      // first check permissions
      const exists = await this.redis.hExists(
        'lecture:{' + args.lectureuuid + '}:videoquestion',
        'permitted:' + args.socketid
      )
      if (!exists) return
      // very well we have the permission, so generate a token for temperory perms

      const routercol = this.mongo.collection<RouterInfo>('avsrouters')

      const majorid = args.lectureuuid
      const clientid = args.lectureuuid + ':' + args.socketid
      const router = await routercol.findOne(
        {
          url: routerurl
        },
        {
          projection: {
            _id: 0,
            url: 1,
            region: 1,
            key: 1,
            spki: 1,
            primaryRealms: { $elemMatch: { $eq: majorid } },
            hashSalt: 1,
            localClients: { $elemMatch: { $eq: clientid } },
            remoteClients: { $elemMatch: { $eq: clientid } }
          }
        }
      )

      if (!router) {
        throw new Error('no router found')
      }
      const selrouter = router

      const calcHash = async (input: string) => {
        const hash = createHash('sha256')
        hash.update(input)
        // console.log('debug router info', router)
        hash.update(selrouter.hashSalt)
        return hash.digest('base64')
      }

      const realmhash = calcHash(args.lectureuuid)
      const clienthash = calcHash(args.socketid)

      let token: TokenType = {
        // todo hash table
        accessWrite: [
          (await realmhash).replace(/[+/]/g, '\\$&') +
            ':' +
            (await clienthash).replace(/[+/]/g, '\\$&')
        ],
        realm: await realmhash,
        client: await clienthash
      }
      const jwttoken = this.signAvsJwt(token)
      return await jwttoken
    } catch (error) {
      console.log('Problem getTempOutTransport', error)
      throw new Error()
    }
  }

  async handleVQoffer(
    args: { lectureuuid: string; socketid: string },
    cmd: {
      type: 'video' | 'audio'
      db: number
    }
  ) {
    // ok to things to do, inform the others about the offer
    // and store the information in redis

    if (
      cmd.type !== 'video' &&
      cmd.type !== 'audio' /* && cmd.type !== 'screen' */
    ) {
      return
    }

    const roomname = this.getRoomName(args.lectureuuid)

    const message = {
      id: args.socketid,
      type: cmd.type,
      db: cmd.db // loundness in case of audio
    }

    this.notepadio.to(roomname).emit('vqoffer', message)
    this.screenio.to(roomname).emit('vqoffer', message)
    this.notesio.to(roomname).emit('vqoffer', message)

    // VQ offers are not saved
  }

  async getPresentationinfo(args: { lectureuuid: string }) {
    try {
      let lectprop = this.redis.hmGet('lecture:{' + args.lectureuuid + '}', [
        'casttoscreens',
        'backgroundbw',
        'showscreennumber'
      ])
      const rlectprop = await lectprop
      return {
        casttoscreens: rlectprop[0] !== null ? rlectprop[0] : 'false',
        backgroundbw: rlectprop[1] !== null ? rlectprop[1] : 'true',
        showscreennumber: rlectprop[2] !== null ? rlectprop[2] : 'false'
      }
    } catch (error) {
      console.log('getPresentationinfo', error)
      return null
    }
  }

  async getPollinfo(args: { lectureuuid: string }) {
    try {
      const pollinfo = await this.redis.hGetAll(
        'lecture:{' + args.lectureuuid + '}:pollstate'
      )
      if (pollinfo.command && pollinfo.data) {
        const limited = !!(pollinfo.limited === 'true')
        let participants
        if (limited) {
          if (!pollinfo.participants) {
            console.log('getPollinfo no participants for limited poll')
            return null
          }
          participants = JSON.parse(pollinfo.participants)
        }

        return {
          command: pollinfo.command,
          data: JSON.parse(pollinfo.data),
          limited,
          participants
        }
      } else return null
    } catch (error) {
      console.log('getPollInfo failed', error)
      return null
    }
  }
}
