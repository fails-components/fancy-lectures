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

import { type RedisClusterType, type RedisClientType } from 'redis'
import type { ExtendedError, Socket } from 'socket.io'
import type { Request } from 'express'

import jwt from 'jsonwebtoken'
import { NodeRedisAdapter, createLock } from 'redlock-universal'
import { expressjwt as jwtexpress } from 'express-jwt'
import { promisify } from 'util'
import { generateKeyPair } from 'node:crypto'
import { type StringValue } from 'ms'

type FailsJwt = jwt.Jwt & {
  payload: {
    kid?: string
  }
}

export interface AuthenticatedSocket extends Socket {
  decoded_token?: Record<string, any>
}

export class FailsJWTSigner {
  constructor(args: {
    redis: RedisClusterType | RedisClientType
    type: string
    expiresIn: StringValue
    secret: string
  }) {
    this.redis = args.redis // redis database holding the keys
    this.type = args.type // e.g. screen, notepad, screen etc.
    this.expiresIn = args.expiresIn // the lifetime of the generated JWT
    this.keys = [] // cache keys
    this.keychecktime = 0

    this.secret = args.secret

    this.redlock = new NodeRedisAdapter(this.redis)

    this.signToken = this.signToken.bind(this)
  }

  async createLock(key: string, ttl: number) {
    return createLock({
      adapter: this.redlock,
      key,
      ttl,
      retryAttempts: 10,
      retryDelay: 200
    })
  }

  async signToken(token: object) {
    const time = Date.now()
    if (
      this.keys.length === 0 ||
      this.keys[0].expire < time ||
      this.keychecktime + 1000 * 60 * 60 * 12 < time
    ) {
      // rotate every 12 h
      await this.recheckKeys()
    }
    // now hopefully we have working keys
    return jwt.sign(
      { ...token, kid: this.keys[0].id },
      this.secret
        ? { key: this.keys[0].privatekey, passphrase: this.secret }
        : this.keys[0].privatekey,
      { expiresIn: this.expiresIn, keyid: this.keys[0].id, algorithm: 'ES512' }
    )
  }

  async recheckKeys() {
    await this.keysUpdateInt()
    let lock = null
    let lockhandle = null
    if (this.keys.length === 0) {
      // ok again, but this time with locking to make sure no other process is generating keys, while we do
      lock = await this.createLock('keys:' + this.type + ':loadlock', 2000)
      lockhandle = await lock.acquire()
      await this.keysUpdateInt()
      // do we still need a new key
      if (this.keys.length === 0) {
        console.log('Generate private public key pair for ' + this.type)
        const id = Math.random().toString(36).slice(2, 11) // not the best for crypto, but does not matter
        const pgenerateKeyPair = promisify(generateKeyPair)
        console.log('new key id:', id)

        try {
          const result = await pgenerateKeyPair('ec', {
            namedCurve: 'P-521',
            publicKeyEncoding: {
              type: 'spki',
              format: 'pem'
            },
            privateKeyEncoding: {
              type: 'pkcs8',
              format: 'pem',
              cipher: 'aes-256-cbc',
              passphrase: this.secret
            }
          })
          await Promise.all([
            this.redis.set(
              'JWTKEY:' + this.type + ':private:' + id,
              result.privateKey,
              { EX: 60 * 60 * 12 }
            ),
            this.redis.set(
              'JWTKEY:' + this.type + ':public:' + id,
              result.publicKey,
              { EX: 60 * 60 * 24 }
            )
          ])
          console.log('new key stored:', id, Date.now())
        } catch (error) {
          console.log('recheckKeys error key create', error)
        }
      }

      if (lock) lock.release(lockhandle)
      await this.keysUpdateInt()
    }
    this.keychecktime = Date.now()
  }

  async keysUpdateInt() {
    // ok first we get all keys in data base
    this.keys = []

    try {
      const promstore = []

      const nodes =
        'masters' in this.redis
          ? await Promise.all(this.redis.masters.map((node) => node.client))
          : [this.redis as RedisClientType]

      for (const node of nodes) {
        let cursor = 0
        if (!node) continue

        do {
          const scanret = await node.scan(cursor, {
            MATCH: 'JWTKEY:' + this.type + ':private:*',
            COUNT: 1000
          }) // keys are seldom

          const myprom = scanret.keys.map((el2) => {
            return Promise.all([
              el2,
              this.redis.multi().get(el2).expireTime(el2).exec() as Promise<
                [string | null, number]
              >
            ])
          })
          promstore.push(...myprom)

          cursor = scanret.cursor
        } while (cursor !== 0)
      }
      const keyres = await Promise.all(promstore)
      const idoffset = ('JWTKEY:' + this.type + ':private:').length
      this.keys = keyres
        .filter(
          (el): el is [string, [string, number]] =>
            el.length === 2 && el[1].length === 2 && el[1][0] !== null
        )
        .map((el) => ({
          id: el[0].slice(idoffset),
          privatekey: el[1][0],
          expire: el[1][1]
        }))
    } catch (error) {
      console.log('keysUpdateInt error', error)
    }
  }
  private redis: RedisClusterType | RedisClientType
  private type: string
  private expiresIn: StringValue
  private secret: string
  private redlock: NodeRedisAdapter
  private keychecktime: number
  private keys: {
    id: string
    privatekey: string
    expire: number
  }[]
}

export class FailsJWTVerifier {
  private redis: RedisClusterType | RedisClientType
  private type: string
  private keys: Record<string, { fetched: number; publicKey: string }>

  constructor(args: {
    redis: RedisClusterType | RedisClientType
    type: string
  }) {
    this.redis = args.redis // redis database holding the keys
    this.type = args.type // e.g. screen, notepad, screen etc.
    this.keys = {}

    this.socketauthorize = this.socketauthorize.bind(this)
    this.fetchKey = this.fetchKey.bind(this)
  }

  socketauthorize() {
    return async (socket: Socket, next: (err?: ExtendedError) => void) => {
      // console.log("auth attempt");
      if (socket.handshake.auth && socket.handshake.auth.token) {
        const decoded = jwt.decode(socket.handshake.auth.token) as
          | FailsJwt
          | null
          | string
        if (!decoded) return next(new Error('Authentification Error'))
        const sdecoded =
          typeof decoded === 'string' ? JSON.parse(decoded) : decoded
        if (!sdecoded.kid) throw new Error('token without keyid')
        const keyid = sdecoded.kid
        const time = Date.now()
        if (
          !this.keys[keyid] ||
          this.keys[keyid].fetched + 60 * 1000 * 10 < time
        ) {
          await this.fetchKey(keyid)
        }
        // console.log("keys",keyid, this.type, this.keys[keyid]);
        if (!this.keys[keyid]) {
          console.log('unknown key abort', keyid, this.type, time)
          return next(
            new Error('Authentification Error, unknown keyid ' + keyid)
          )
        }
        jwt.verify(
          socket.handshake.auth.token,
          this.keys[keyid].publicKey /* TODO */,
          { algorithms: ['ES512'] },
          (err, decoded) => {
            if (err) {
              return next(new Error('Authentification Error'))
            }
            if (typeof decoded !== 'undefined') {
              // eslint-disable-next-line camelcase
              ;(socket as AuthenticatedSocket).decoded_token =
                typeof decoded === 'string' ? JSON.parse(decoded) : decoded
            }
            console.log('socket authorize worked!')
            next()
          }
        )
      } else {
        next(new Error('Authentification error'))
      }
    }
  }

  async fetchKey(key: string) {
    delete this.keys[key] // delete, important for key expiry
    const name = 'JWTKEY:' + this.type + ':public:' + key
    try {
      let publick = this.redis.get(name)
      const publickr = await publick
      // console.log('public', publick, name)
      if (!publickr) return // not found
      this.keys[key] = {
        publicKey: publickr,
        fetched: Date.now()
      }
    } catch (err) {
      console.log('Error fetchKey', err)
    }
  }

  async getPublicKey(keyid: string) {
    const time = Date.now()

    if (!this.keys[keyid] || this.keys[keyid].fetched + 60 * 1000 * 10 < time) {
      await this.fetchKey(keyid)
      if (!this.keys[keyid]) return null
    }
    return this.keys[keyid].publicKey
  }

  express() {
    const secretCallback = async (
      req: Request,
      token: FailsJwt | undefined
    ) => {
      if (!token) throw new Error('no token passed')
      const { payload } = token
      const keyid = payload.kid
      if (!keyid) throw new Error('token without keyid')
      const time = Date.now()

      if (
        !this.keys[keyid] ||
        this.keys[keyid].fetched + 60 * 1000 * 10 < time
      ) {
        await this.fetchKey(keyid)
        if (!this.keys[keyid])
          throw new Error('unknown or expired key or db error')
      }
      return this.keys[keyid].publicKey
    }
    return jwtexpress({
      secret: secretCallback,
      algorithms: ['ES512'],
      requestProperty: 'token'
    })
  }
}
