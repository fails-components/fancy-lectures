/* eslint-disable node/no-callback-literal */
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
import { randomBytes } from 'crypto'
import { promisify } from 'util'
import { v4 as uuidv4, validate as isUUID } from 'uuid'

export class AuthConnection {
  constructor(args) {
    this.redis = args.redis
    this.authio = args.authio
    this.redissub = this.redis.duplicate()
    this.redissub.connect()

    this.authhandlerURL = args.authhandlerURL

    this.signScreenJwt = args.signScreenJwt
    this.signNotepadJwt = args.signNotepadJwt
    this.signNotesJwt = args.signNotesJwt

    this.notepadhandlerURL = args.notepadhandlerURL
    this.noteshandlerURL = args.noteshandlerURL

    this.SocketHandlerAuth = this.SocketHandlerAuth.bind(this)
  }

  async SocketHandlerAuth(socket) {
    const address = socket.client.conn.remoteAddress
    console.log('Auth %s with ip %s  connected', socket.id, address)

    let currequest = null

    const subfunct = async (message) => {
      const pmess = JSON.parse(message)
      if (isUUID(pmess.uuid) && pmess.user && isUUID(pmess.user.useruuid)) {
        console.log('request', pmess)
        const res = await this.processRequest(currequest, pmess)
        console.log('result', res)
        socket.emit('reqprocessed', res)
      }
      if (currequest) this.cancelRequest(currequest)
      currequest = null
    }

    const clearfunct = () => {
      if (currequest) {
        this.cancelRequest(currequest)
      }
      currequest = null
    }

    socket.on('request', async (cmd, callback) => {
      // we use the information from the already present authtoken
      if (currequest) await this.cancelRequest(currequest)
      const requestinfo = await this.startRequest(cmd, subfunct, clearfunct)
      currequest = requestinfo
      if (requestinfo) callback(requestinfo.code)
    })

    socket.on('disconnect', () => {
      console.log('Auth Client %s with ip %s  disconnected', socket.id, address)
      if (currequest) this.cancelRequest(currequest)
      currequest = null
    })
  }

  async startRequest(cmd, subfunct, clearfunct) {
    const randomBytesAsync = promisify(randomBytes)
    try {
      let id = null
      while (id == null) {
        const rbytes = await randomBytesAsync(5)
        id = rbytes.toString('base64').slice(0, -1)
        const notnew = await this.redis.exists('auth::' + id)
        if (notnew[0]) id = null
      }
      // ok we have an id/cide
      const toret = {}
      toret.code = id
      if (cmd.reqs && Array.isArray(cmd.reqs)) {
        toret.reqs = cmd.reqs
          .filter(
            (el) =>
              el.purpose === 'screen' ||
              el.purpose === 'lecture' ||
              el.purpose === 'notes'
          )
          .slice(0, 10)
          .map((el) => ({ purpose: el.purpose, id: el.id }))
      } else return null
      await this.redis.set('auth::' + id, '1', { EX: 20 * 60 })
      this.redissub.subscribe('auth::' + id, subfunct)

      toret.clearid = setTimeout(clearfunct, 10 * 60 * 1000)
      return toret
    } catch (error) {
      console.log('error in startRequest', cmd, error)
    }
  }

  async cancelRequest(cmd) {
    if (!cmd) return null
    if (cmd.clearid) clearTimeout(cmd.clearid)
    this.redissub.unsubscribe('auth::' + cmd.code)
    this.redis.del('auth::' + cmd.code)
  }

  async processRequest(currequest, pmess) {
    let toret = null
    if (currequest) {
      if (currequest.reqs) {
        toret = currequest.reqs.map(async (el) => {
          if (el.purpose === 'notes') {
            const content = {
              lectureuuid: pmess.uuid,
              notescreenuuid: uuidv4(),
              purpose: 'notes',
              name: 'AuthNotes',
              user: pmess.user,
              appversion: pmess.appversion,
              features: pmess.features,
              noteshandler: this.noteshandlerURL,
              maxrenew: 288 // 24-48h, depending on renewal frequency
            }
            return {
              token: await this.signNotesJwt(content),
              id: el.id,
              purpose: el.purpose
            }
          } else if (el.purpose === 'screen') {
            const content = {
              lectureuuid: pmess.uuid,
              notescreenuuid: uuidv4(),
              purpose: 'screen',
              name: 'AuthScreen',
              user: pmess.user,
              appversion: pmess.appversion,
              features: pmess.features,
              notepadhandler: this.notepadhandlerURL,
              maxrenew: 288 // 24-48h, depending on renewal frequency
            }
            return {
              token: await this.signScreenJwt(content),
              id: el.id,
              purpose: el.purpose
            }
          } else if (el.purpose === 'lecture') {
            const content = {
              lectureuuid: pmess.uuid,
              notescreenuuid: uuidv4(),
              purpose: 'lecture',
              name: 'AuthNotebook',
              user: pmess.user,
              appversion: pmess.appversion,
              features: pmess.features,
              notepadhandler: this.notepadhandlerURL,
              maxrenew: 288 // 24-48h, depending on renewal frequency
            }
            return await {
              token: await this.signNotepadJwt(content),
              id: el.id,
              purpose: el.purpose
            }
          }
        })
      }
      toret = Promise.all(toret)
      return toret
    }
  }
}
