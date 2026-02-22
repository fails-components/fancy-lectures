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

import {
  commandOptions,
  type RedisClusterType,
  type RedisClientType
} from 'redis'
import CIDRMatcher from 'cidr-matcher'
import { serialize as BSONserialize } from 'bson'
import { createHash, webcrypto as crypto } from 'crypto'
import type {
  Db as MongoDb,
  ObjectId,
  Binary,
  UpdateFilter,
  WithId,
  Document,
  Filter
} from 'mongodb'
import type { Socket, Namespace } from 'socket.io'
import type { webcrypto } from 'node:crypto'
import type { FailsJWTSigner } from '@fails-components/security'

export type BasicIdType = {
  lectureuuid: string
  socketid: string
  appversion: string
  features: string[]
  user?: string
  name: string
  displayname: string
  screensharechannelid?: string
  roomname?: string
  userhash?: string
  cryptKey?: string
  signKey?: string
}

export type NotepadScreenIdType = BasicIdType & {
  lectureuuid: string
  socketid: string
  notescreenuuid: string
  purpose: 'notepad' | 'screen'
  appversion: string
  features: string[]
  user?: string
  name: string
  displayname: string
  screensharechannelid?: string
  roomname?: string
  userhash?: string
  cryptKey?: string
  signKey?: string
  color?: string
  keymaster?: boolean
}

export type NotesIdType = BasicIdType & {
  lectureuuid: string
  socketid: string
  purpose: 'notes'
  appversion: string
  features: string[]
  user?: string
  name: string
  displayname: string
  screensharechannelid?: string
  roomname?: string
  userhash?: string
  cryptKey?: string
  signKey?: string
  color?: string
}

export type NotepadScreenOnlyIdType = {
  lectureuuid: string
}

// database types lecture
export interface Lecture {
  _id: ObjectId
  lms: {
    iss: string
    resource_id: string
    course_id: string
    platform_id: string
    deploy_id: string
  }
  title: string
  coursetitle: string
  uuid: string
  owners: string[]
  ownersdisplaynames: string[]
  lastaccess: Date
  owner: string[]
  date: Date
  pictures: MongoFile[]
  backgroundpdfuse: number
  backgroundpdf: BackgroundPdf
  polls: LecturePoll[]
  boards: string[]
  boardsavetime: number
  backgroundbw: string | boolean // Appears as "true" (string) in your JSON
  usedpictures: MongoFile[]
  appversion: string
  features: string[]
  ipynbs: PyNotebook[]
  usedipynbs: PyNotebook[]
}

export interface LectureBoard {
  uuid: string
  board: string
  savetime: number
  boarddata: Binary
}

// Support Interfaces
export interface MongoFile {
  name: string
  mimetype: string
  sha: Binary
  tsha: Binary
}

export interface LecturePoll {
  id: string
  name: string
  multi: boolean
  note?: string
  children?: PollOption[]
}

interface PollOption {
  id: string
  name: string
}

export interface PyNotebook {
  id: string
  name: string
  sha: Binary
  mimetype: string
  filename: string
  presentDownload: 'no' | 'download' | 'downloadAndEdit'
  note: string
  applets: PyApplet[]
}

interface PyApplet {
  appid: string
  appname: string
  presentToStudents: boolean
  parts: PyAppletPart[]
}

interface PyAppletPart {
  index: number
  id?: string
}

interface BackgroundPdf {
  sha: Binary
}

export type RouterHash = string

// database types router
export interface RouterInfo {
  url: string
  wsurl: string
  spki: string
  key: webcrypto.JsonWebKey
  numClients: number
  maxClients: number
  numRouterClients: number
  numRealms: number
  maxRealms: number
  localClients: RouterHash[]
  remoteClients: RouterHash[]
  primaryRealms: RouterHash[]
  changedAt: Date
  region: string
  hashSalt: string
}

export interface TransportInfo {
  ipaddress: string[]
  geopos?: { longitude: number; latitude: number }
  lectureuuid: string
  clientid: string
  canWrite: boolean
}

export interface GeoJSONPoint {
  type: 'Point'
  coordinates: [number, number]
}

export interface Region {
  name: string
  hmac: Buffer | Binary
  ipfilter?: string[]
  geopos: GeoJSONPoint[]
  changedAt: Date
  fetchTime?: number
}

export interface RegionBasic {
  name: string
  hmac: Buffer | Binary
  ipfilter?: string[]
}

// ticket types

export interface TicketType {
  aeskey: ArrayBuffer
  payload: ArrayBuffer
  iv: Uint8Array<ArrayBuffer>
}

export interface TokenType {
  accessRead?: string[]
  accessWrite?: string[]
  primaryRealm?: string
  realm: string
  client: string
}

// Interfaces for method arguments

export interface CryptoIdentity {
  signKey: string
  cryptKey: string
  displayname: string
  userhash: string
  purpose: string
  lastaccess: string
}

export interface AddUpdateCryptoIdentArgs {
  signKey: string
  cryptKey: string
  displayname: string
  userhash: string
  purpose: string
  lectureuuid: string
  socketid: string | number
}

export abstract class CommonConnection {
  protected abstract mongo: MongoDb
  protected abstract getFileURL: (sha: Binary, mimetype: string) => string
  protected abstract signAvsJwt: FailsJWTSigner['signToken']
  protected abstract notepadio: Namespace
  protected abstract notesio: Namespace
  protected abstract screenio: Namespace
  protected abstract redis: RedisClusterType | RedisClientType

  async getUsedAssets(notepadscreenid: NotepadScreenOnlyIdType) {
    try {
      const lecturescol = this.mongo.collection<Lecture>('lectures')
      let lecturedoc = await lecturescol.findOne(
        { uuid: notepadscreenid.lectureuuid },
        {
          projection: {
            _id: 0,
            usedpictures: 1,
            backgroundpdfuse: 1,
            backgroundpdf: 1,
            usedipynbs: 1
          }
        }
      )
      if (!lecturedoc) return

      return {
        usedpict:
          lecturedoc?.usedpictures?.map?.((el) => {
            return {
              name: el.name,
              mimetype: el.mimetype,
              sha: el.sha.toString('hex'),
              url: this.getFileURL(el.sha, el.mimetype),
              urlthumb: this.getFileURL(el.tsha, el.mimetype)
            }
          }) || [],
        bgpdf:
          (lecturedoc?.backgroundpdfuse &&
            lecturedoc.backgroundpdf &&
            lecturedoc.backgroundpdf.sha &&
            this.getFileURL(lecturedoc.backgroundpdf.sha, 'application/pdf')) ||
          null,
        usedipynbs:
          lecturedoc.usedipynbs?.map?.((el) => {
            return {
              name: el.name,
              filename: el.filename,
              /* note: el.note, */
              mimetype: el.mimetype,
              id: el.id,
              sha: el.sha.toString('hex'),
              applets: el.applets?.map?.((applet: PyApplet) => ({
                appid: applet.appid,
                appname: applet.appname
              })),
              url: this.getFileURL(el.sha, el.mimetype)
            }
          }) || []
      }

      // ok now I have the picture, but I also have to generate the urls
    } catch (err) {
      console.log('error in getUsedPicts pictures', err)
    }
  }

  async sendBoardsToSocket(lectureuuid: string, socket: Socket) {
    // we have to send first information about pictures
    // TODO use one mongo transaction
    const usedAssets = await this.getUsedAssets({
      lectureuuid: lectureuuid
    })
    if (usedAssets) {
      const {
        usedpict = undefined,
        bgpdf = null,
        usedipynbs = undefined
      } = usedAssets
      if (usedpict) {
        socket.emit('pictureinfo', usedpict)
      }
      if (bgpdf) {
        socket.emit('bgpdfinfo', { bgpdfurl: bgpdf })
      } else {
        socket.emit('bgpdfinfo', { none: true })
      }
      if (usedipynbs) {
        socket.emit('ipynbinfo', { ipynbs: usedipynbs })
      }
    }

    try {
      const res = await this.redis.sMembers(
        'lecture:{' + lectureuuid + '}:boards'
      )

      // console.log('boards', res, 'lecture:' + lectureuuid + ':boards')
      const length = res.length
      let countdown = length
      if (length === 0) socket.emit('reloadBoard', { last: true })
      for (const index in res) {
        const boardnum = res[index]
        // console.log('sendBoardsToSocket', boardnum, lectureuuid)
        try {
          const res2 = await this.redis.get(
            commandOptions({ returnBuffers: true }),
            'lecture:{' + lectureuuid + '}:board' + boardnum
          )

          countdown--
          // console.log('send reloadboard', boardnum, res2, length)
          const send = {
            number: boardnum,
            data: res2,
            last: countdown === 0
          }
          socket.emit('reloadBoard', send)
        } catch (error) {
          console.log('error in sendboard to sockets loop', error)
        }
      }
    } catch (error) {
      console.log('error in sendboard to sockets', error)
    }
  }

  async getLectDetail(notepadscreenid: BasicIdType, socket: Socket) {
    // TODO should be feed from mongodb

    type LectureProjection = Pick<
      Lecture,
      'title' | 'coursetitle' | 'ownersdisplaynames' | 'date'
    >
    let lecturedoc: LectureProjection | null = null
    try {
      const lecturescol = this.mongo.collection<Lecture>('lectures')

      lecturedoc = await lecturescol.findOne(
        { uuid: notepadscreenid.lectureuuid },
        {
          projection: {
            _id: 0,
            title: 1,
            coursetitle: 1,
            ownersdisplaynames: 1,
            date: 1
          }
        }
      )
    } catch (err) {
      console.log('error in get LectDetail', err)
    }
    if (!lecturedoc) return

    const lectdetail = {
      title: lecturedoc.title,
      coursetitle: lecturedoc.coursetitle,
      instructors: lecturedoc.ownersdisplaynames,
      date: lecturedoc.date
    }
    // if (notepadscreenid.notepaduuid) lectdetail.notepaduuid=notepadscreenid.notepaduuid;
    socket.emit('lecturedetail', lectdetail)
  }

  // sync changes to notes
  async addUpdateCryptoIdent(args: AddUpdateCryptoIdentArgs) {
    const identity: CryptoIdentity = {
      signKey: args.signKey,
      cryptKey: args.cryptKey,
      displayname: args.displayname,
      userhash: args.userhash,
      /* id: args.socketid, */
      purpose: args.purpose,
      lastaccess: Date.now().toString()
    }
    // Two things store it in redis until disconnect
    const oldidentProm = this.redis.hGet(
      'lecture:{' + args.lectureuuid + '}:idents',
      args.socketid.toString()
    )
    this.redis.hSet('lecture:{' + args.lectureuuid + '}:idents', [
      args.socketid.toString(),
      JSON.stringify(identity)
    ])
    let oldid: CryptoIdentity | undefined = undefined
    const oldident = await oldidentProm
    if (oldident) {
      try {
        oldid = JSON.parse(oldident)
      } catch (e) {
        console.error('Failed to parse old identity', e)
      }
    }

    // and inform about new/updated identity
    const roomname = this.getRoomName(args.lectureuuid)

    if (
      oldid &&
      identity.signKey === oldid.signKey &&
      identity.cryptKey === oldid.cryptKey
    ) {
      this.notepadio.to(roomname).emit('identValidity', {
        lastaccess: identity.lastaccess,
        id: args.socketid
      })
    } else {
      this.notepadio
        .to(roomname)
        .emit('identUpdate', { identity: identity, id: args.socketid })
    }
  }

  async handleKeymasterQuery(
    args: NotepadScreenOnlyIdType & AddUpdateCryptoIdentArgs
  ) {
    const now = Date.now() / 1000
    // ok, first we have to figure out if a query is already running
    try {
      const operation = async (isoredis: typeof this.redis) => {
        await isoredis.watch('lecture:{' + args.lectureuuid + '}:keymaster')
        const queryInfo = await isoredis.hGet(
          'lecture:{' + args.lectureuuid + '}:keymaster',
          'queryTime'
        )

        if (queryInfo && now - Number(queryInfo) < 15) {
          // we have no key, so may be the kaymaster does not know that we exist
          await this.addUpdateCryptoIdent(args)
          return // do not spam the system with these queries 20 +10
        }

        const res = await isoredis
          .multi()
          .hSet('lecture:{' + args.lectureuuid + '}:keymaster', [
            'queryTime',
            now.toString(),
            'bidding',
            '0',
            'master',
            'none'
          ])
          .exec()
        if (res !== null) {
          const roomname = this.getRoomName(args.lectureuuid)
          // start the bidding
          this.notepadio.to(roomname).emit('keymasterQuery')
        }
      }
      if ('executeIsolated' in this.redis) {
        await this.redis.executeIsolated(operation)
      } else {
        await operation(this.redis)
      }
    } catch (error) {
      console.log('handleKeymasterQuery problem or multple attempts', error)
    }
  }

  async emitAVOffers(socket: Socket, args: NotepadScreenOnlyIdType) {
    const alloffers = await this.redis.hGetAll(
      'lecture:{' + args.lectureuuid + '}:avoffers'
    )
    const offers = []
    for (const label in alloffers) {
      const labels = label.split(':')
      offers.push({
        type: labels[0],
        id: labels[1].slice(1, -1),
        time: alloffers[label]
      })
    }
    if (offers.length > 0) socket.emit('avofferList', { offers })
  }

  async emitVideoquestions(socket: Socket, args: NotepadScreenOnlyIdType) {
    const allquestions = await this.redis.hGetAll(
      'lecture:{' + args.lectureuuid + '}:videoquestion'
    )
    const vquestions = []
    for (const label in allquestions) {
      try {
        const labels = label.split(':')
        const obj = JSON.parse(allquestions[label])
        vquestions.push({
          id: labels[1].slice(1, -1),
          ...obj
        })
      } catch (error) {
        console.log('Problem vquestion parse', error)
      }
    }
    if (vquestions.length > 0) socket.emit('videoquestionList', { vquestions })
  }

  async closeVideoQuestion(args: NotepadScreenOnlyIdType, cmd: { id: string }) {
    if (!cmd.id) return // do not proceed without id.
    const roomname = this.getRoomName(args.lectureuuid)

    const message = {
      id: cmd.id
    }

    this.notepadio.to(roomname).emit('closevideoquestion', message)
    this.screenio.to(roomname).emit('closevideoquestion', message)
    this.notesio.to(roomname).emit('closevideoquestion', message)

    try {
      await this.redis.hDel(
        'lecture:{' + args.lectureuuid + '}:videoquestion',
        ['permitted:' + cmd.id]
      )
    } catch (error) {
      console.log('problem in closeVideoQuestion', error)
    }
  }

  getRoomName(uuid: string) {
    return uuid
  }

  async getRouting(
    args: BasicIdType,
    cmd: { id: string; dir: 'in' | 'out'; tempOut?: string },
    routerurl: string,
    callback: (
      arg:
        | { notfound: string }
        | { error: string }
        | {
            tickets: {
              aeskey: ArrayBuffer
              payload: ArrayBuffer
              iv: Uint8Array<ArrayBuffer>
            }[]
          }
    ) => void
  ) {
    const majorid = args.lectureuuid
    const clientid = args.lectureuuid + ':' + cmd.id
    const clientidpure = cmd.id

    let tickets: TicketType[] // routing tickets

    let hops = []

    const options = {
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

    try {
      const routercol = this.mongo.collection<RouterInfo>('avsrouters')
      // first hop the actual router client
      hops.push(
        routercol.findOne(
          {
            url: routerurl
          },
          options
        )
      )
      if (cmd.dir === 'out' && cmd.id !== args.socketid) {
        // if we are sending out, it must be the clients own id!
        throw new Error('Sending data with foreign id is not permitted')
      }
      if (cmd.dir === 'in') {
        // this is the clients perspective, so what is coming in
        // for 'out' we have all we need
        // now we need the router with the actual target client
        hops.push(
          routercol.findOne(
            {
              localClients: clientid
            },
            options
          )
        )
        // now we have to find out, if these two are in the same region
        await Promise.all(hops)
        const first = await hops[0]
        const last = await hops[1]
        // in this case we need two more routers
        if (!first) throw new Error('router not found')
        if (!last) {
          console.log('target client not found ' + clientid)
          callback({ notfound: clientid })
          return
        }
        let inspos = 1
        // console.log('first debug', first, majorid)
        // console.log('last debug', last)
        if (!first.localClients) first.localClients = []
        if (!first.remoteClients) first.remoteClients = []
        if (!first.primaryRealms) first.primaryRealms = []
        if (!last.localClients) last.localClients = []
        if (!last.primaryRealms) last.primaryRealms = []
        if (!first.localClients.includes(clientid)) {
          if (
            !first.primaryRealms.includes(majorid) &&
            first.region !== last.region
          ) {
            hops.splice(
              inspos,
              0,
              routercol.findOne(
                {
                  region: first.region,
                  primaryRealms: majorid
                },
                options
              )
            )
            inspos++
          }
          if (
            (!last.primaryRealms || !last.primaryRealms.includes(majorid)) &&
            first.region !== last.region
          ) {
            hops.splice(
              inspos,
              0,
              routercol.findOne(
                {
                  region: last.region,
                  primaryRealms: majorid
                },
                options
              )
            )
            inspos++
          }
          // we got everything
        } else {
          hops.pop()
        }
      }

      const fhops = (await Promise.all(hops)).filter(
        (t): t is WithId<RouterInfo> => t !== null
      )
      // now we create routing information, from the hops
      const ptickets = (await Promise.all(fhops))
        .map(async (ele, index, array) => {
          if (!ele) return
          const salt = ele.hashSalt
          const calcHash = async (input: string) => {
            const hash = createHash('sha256')
            hash.update(input)
            hash.update(salt)
            return hash.digest('base64')
          }

          const cid = await calcHash(clientidpure)
          const mid = await calcHash(majorid)
          const ret: {
            client: string
            realm: string
            next?: string
            nextspki?: string
            tempOut?: string
          } = {
            client: mid + ':' + cid,
            realm: mid
          }
          if (index < array.length - 1) {
            const element = array[index + 1]
            if (element) {
              ret.next = element.url
              ret.nextspki = element.spki
            }
          }
          if (index === 0 && cmd.tempOut) {
            ret.tempOut = cmd.tempOut
          }
          // we need also to update the translation table
          const update: UpdateFilter<RouterInfo> = {
            $set: {}
          }
          update.$set = {}
          update.$set['transHash.' + mid] = majorid
          update.$set['transHash.' + cid] = clientidpure
          await routercol.updateOne({ url: ele.url }, update)
          return { data: ret, key: ele.key }
        })
        .map(async (ele) => {
          // ok we now need to encrypt it
          try {
            const el = await ele
            if (!el) return
            const aeskey = await crypto.subtle.generateKey(
              {
                name: 'AES-GCM',
                length: 256
              },
              true,
              ['encrypt', 'decrypt']
            )
            const iv = crypto.getRandomValues(new Uint8Array(12))
            const retval = {
              aeskey: await crypto.subtle.encrypt(
                {
                  name: 'RSA-OAEP'
                },
                await crypto.subtle.importKey(
                  'jwk',
                  el.key,
                  {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                  },
                  true,
                  ['encrypt']
                ),
                await crypto.subtle.exportKey('raw', aeskey)
              ),
              payload: await crypto.subtle.encrypt(
                {
                  name: 'AES-GCM',
                  iv
                },
                aeskey,
                BSONserialize(el.data) as Uint8Array<ArrayBuffer>
              ),
              iv
            }
            return retval
          } catch (error) {
            console.log('error exporting key', error)
            throw error
          }
        })
      const ttickets = (await Promise.all(ptickets)).filter(
        (t): t is TicketType => t !== null
      )
      tickets = ttickets
    } catch (error) {
      console.log('getRouting error', error)
      callback({ error: String(error) })
      return
    }
    if (tickets) callback({ tickets })
    else callback({ error: 'No tickets' })
  }

  async getTransportInfo(
    args: TransportInfo,
    callback: (arg0: {
      error?: string
      url?: string
      wsurl?: string
      spki?: string
      token?: {}
    }) => void
  ) {
    const regions: RegionBasic[] = []
    let router: WithId<RouterInfo> | null = null

    let token: TokenType | undefined

    try {
      // iterate over all regions until something matches
      const regioncol = this.mongo.collection<Region>('avsregion')
      {
        const regioncursorip = regioncol
          .find({ ipfilter: { $exists: true } })
          .project<RegionBasic>({ _id: 0, name: 1, hmac: 1, ipfilter: 1 })
        for await (const el of regioncursorip) {
          if (el.ipfilter) {
            const matcher = new CIDRMatcher(el.ipfilter)
            if (matcher.containsAny(args.ipaddress)) {
              regions.push(el)
            }
          } else regions.push(el)
        }
      }
      if (args.geopos) {
        const regioncursorgeo = regioncol.aggregate<Region>([
          {
            $geoNear: {
              near: [args.geopos.longitude, args.geopos.latitude],
              spherical: true,
              key: 'geopos',
              query: { geopos: { $exists: true } },
              distanceField: 'dist.calculated'
            }
          }
        ])
        for await (const el of regioncursorgeo) {
          if (el.geopos && !el.ipfilter) {
            regions.push(el)
          }
        }
      }
      {
        const remain: Filter<Document> = { ipfilter: { $exists: false } }
        if (args.geopos) remain.geopos = { $exists: false }
        const regioncursor = regioncol.find(remain)
        await regioncursor.forEach((el) => {
          if (!el.ipfilter) {
            regions.push(el)
          }
        })
      }
      // we got our regions list, now we iterate over all regions until
      // we find a suitable router

      const routercol = this.mongo.collection<RouterInfo>('avsrouters')
      let primary
      let region: RegionBasic | undefined
      while (regions.length > 0 && !router) {
        region = regions.shift()
        if (typeof region === 'undefined') continue
        primary = true
        let cursor = routercol
          .find({
            region: { $eq: region.name },
            $expr: { $gt: ['$maxClients', '$numClients'] },
            primaryRealms: args.lectureuuid
          })
          .sort({ numClients: -1 })
        if ((await cursor.count()) < 1) {
          cursor.close()
          primary = false
          // go to secondary realm
          cursor = routercol
            .find({
              region: { $eq: region.name },
              $expr: { $gt: ['$maxClients', '$numClients'] },
              localClients: { $regex: args.lectureuuid + ':[a-zA-Z0-9-]+' } // may be remoteClients
            })
            .sort({ numClients: -1 })
          if ((await cursor.count()) < 1) {
            primary = false
            cursor.close()
            // last try, a new router
            cursor = routercol
              .find({
                region: { $eq: region.name },
                $and: [
                  { $expr: { $gt: ['$maxClients', '$numClients'] } },
                  { $expr: { $gt: ['$maxRealms', '$numRealms'] } }
                ]
              })
              .sort({ maxRealms: -1, numClients: -1 })
            if ((await cursor.count()) < 1) {
              continue
            }
          }
        }
        router = await cursor.next()
        cursor.close()
      }
      if (!router) {
        callback({
          error: 'no router found'
        })
        return
      }
      const selrouter = router
      if (!region) {
        callback({
          error: 'no region selected'
        })
        return
      }

      // ok we got a cursor...
      // if it is not primary, we have to find out, if there is a primary
      let setprimary = false
      if (!primary) {
        const dprimary = await routercol.findOne({
          region: { $eq: region.name },
          primaryRealms: args.lectureuuid
        })
        if (!dprimary) setprimary = true
      }
      const update: UpdateFilter<RouterInfo> = {}
      const calcHash = async (input: string) => {
        const hash = createHash('sha256')
        hash.update(input)
        // console.log('debug router info', router)
        hash.update(selrouter.hashSalt)
        return hash.digest('base64')
      }

      const realmhash = calcHash(args.lectureuuid)
      const clienthash = calcHash(args.clientid)
      update.$set = {} as Record<string, string>
      const frealmhash = await realmhash
      const fclienthash = await clienthash
      update.$set['transHash.' + frealmhash] = args.lectureuuid
      update.$set['transHash.' + fclienthash] = args.clientid

      let token: TokenType = {
        // todo hash table
        accessRead: [frealmhash.replace(/[+/]/g, '\\$&') + ':[a-zA-Z0-9-/+=]+'],
        realm: frealmhash,
        client: fclienthash
      }
      if (args.canWrite) {
        // you can only write to your own! Readinf everything is fine
        token.accessWrite = [
          frealmhash.replace(/[+/]/g, '\\$&') +
            ':' +
            fclienthash.replace(/[+/]/g, '\\$&')
        ]
      }
      if (setprimary) {
        if (!update.$addToSet)
          (update.$addToSet as any).primaryRealms = args.lectureuuid
      }
      if (setprimary || primary) token.primaryRealm = await realmhash

      await routercol.updateOne({ url: router.url }, update)
    } catch (error) {
      console.log('getTransportError', error)
    }
    if (!router) {
      callback({
        error: 'problem in getting router'
      })
      return
    }
    if (!token) {
      callback({
        error: 'problem in getting router token'
      })
      return
    }
    const jwttoken = this.signAvsJwt(token)

    // perfect we have enough information to give the transport info back
    callback({
      url: router.url,
      wsurl: router.wsurl,
      spki: router.spki,
      token: await jwttoken
    })
  }
}
