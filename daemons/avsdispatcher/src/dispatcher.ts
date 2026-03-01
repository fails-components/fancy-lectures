/*
    Fails Components (Fancy Automated Internet Lecture System - Components)
    Copyright (C)  2015-2017 (original FAILS), 
                   2022- (FAILS Components)  Marten Richter <marten.richter@freenet.de>

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

import { webcrypto } from 'crypto'
import { expressjwt as jwtexpress } from 'express-jwt'
import type { Request, Express } from 'express'
import { type Db as MongoDb, Binary } from 'mongodb'
import type {
  FailsJWTSigner,
  FailsJWTVerifier
} from '@fails-components/security'
import type { Region } from '@fails-components/commonhandler'
import jwt from 'jsonwebtoken'

interface AuthenticatedRegionRequest extends Request {
  token: {
    region: string
  }
}

export type BufferRegion = Omit<Region, 'hmac'> & { hmac: Buffer }

export class AVSDispatcher {
  protected mongo: MongoDb
  protected signAvsJwt: FailsJWTSigner['signToken']
  protected verifier: FailsJWTVerifier
  protected regions: Partial<Record<string, BufferRegion>> | undefined

  constructor(args: {
    mongo: MongoDb
    signAvsJwt: FailsJWTSigner['signToken']
    verifier: FailsJWTVerifier
  }) {
    this.mongo = args.mongo
    this.verifier = args.verifier
    this.signAvsJwt = args.signAvsJwt

    // prepare regions
    if (!process.env.REGIONS) throw new Error('No REGIONS specified')
    const initregionscb = () => {
      try {
        this.initRegions()
      } catch (error) {
        console.log('initRegion failed', error)
      }
    }
    initregionscb()
    setInterval(initregionscb, 1 * 12 * 60 * 60 * 1000) // update in database at least twice a day
  }

  async initRegions() {
    if (!process.env.REGIONS) return
    const regions = process.env.REGIONS.split(' ')
      .map((el) => el.split('|'))
      .map((el) => ({
        name: el[0],
        hmac: Buffer.from(el[1], 'base64'),
        ipfilter: el[2] !== '' ? el[2].split(',') : undefined,
        geopos: el[3]
          .split(';')
          .map((el) => {
            const posarr = el.split(',')
            if (posarr.length < 2) return undefined
            else
              return {
                type: 'Point' as const,
                coordinates: [Number(posarr[0]), Number(posarr[1])] as [
                  number,
                  number
                ]
              }
          })
          .filter((el) => el !== undefined),
        changedAt: new Date()
      }))

    try {
      const regioncol = this.mongo.collection<Region>('avsregion')
      const insertprom = regions.map(async (el) => {
        try {
          const nel = {
            ...el,
            hmac: new Binary(el.hmac)
          }
          await regioncol.updateOne(
            { name: el.name },
            {
              $set: nel
            },
            { upsert: true }
          )
        } catch (error) {
          console.log('error db regio update', error)
        }
      })

      await Promise.all(insertprom)
      const regionByName: Record<string, BufferRegion> = {}
      regions.forEach((el) => {
        const nel = { ...el, fetchTime: Date.now() }
        regionByName[el.name] = nel
      })
      this.regions = regionByName
    } catch (error) {
      console.log('error db regio update all', error)
    }
  }

  async fetchRegion(region: string) {
    const regioncol = this.mongo.collection<Region>('avsregion')
    const regdoc = await regioncol.findOne({ name: region })
    if (regdoc) {
      const nregdoc: BufferRegion = {
        ...regdoc,
        ...{ hmac: Buffer.from(regdoc.hmac.buffer) }
      }
      if (!this.regions) {
        throw new Error('Regions are not defined')
      }
      this.regions[region] = nregdoc
      this.regions[region].fetchTime = Date.now()
    }
  }

  express() {
    const secretCallback = async (req: Request, token: jwt.Jwt | undefined) => {
      if (!token || typeof token.payload === 'string') {
        throw new Error('Invalid token structure')
      }
      const region = token.payload.region
      if (token.payload.region !== token.header.kid)
        throw new Error('kid region mismatch')
      if (!region) throw new Error('no region provided')
      if (!this.regions) throw new Error('No regions available')
      if (
        !this.regions[region] ||
        (this.regions[region].fetchTime &&
          this.regions[region].fetchTime + 1000 * 60 * 2 < Date.now()) ||
        !this.regions[region].fetchTime
      ) {
        // ok, may be another handler installed the region
        await this.fetchRegion(region)
      }
      if (!this.regions[region]) {
        throw new Error('unknown region')
      }

      return this.regions[region].hmac
    }
    return jwtexpress({
      secret: secretCallback,
      algorithms: ['HS512'],
      requestProperty: 'token'
    })
  }

  installHandlers(path: string, app: Express) {
    // renew the auth token
    app.get(path + '/key', async (req, res) => {
      // console.log('get key ', req.query)
      const kid = req.query.kid
      if (!(typeof kid === 'string' && kid.match(/^[0-9a-zA-Z]+$/)))
        return res.status(401).send('malformed request')
      try {
        const pubkey = await this.verifier.getPublicKey(kid)

        if (!pubkey) res.status(404).send('key not found')
        else res.status(200).json({ key: pubkey })
      } catch (error) {
        console.log('avskeys get error', error)
        return res.status(500).send('get key error')
      }
    })
    app.get(path + '/token', async (req, res) => {
      console.log('get token ', req.query)
      if (!(req.query.url && typeof req.query.url === 'string'))
        return res.status(401).send('malformed request')
      try {
        const token = await this.signAvsJwt({
          router: true,
          url: req.query.url
        })
        console.log('inspect token', token)

        if (!token) res.status(404).send('token creation failed')
        else res.status(200).json({ token })
      } catch (error) {
        console.log('avs token creation error', error)
        return res.status(500).send('get token error')
      }
    })
    app.put(path + '/router', async (req, res) => {
      type numericFields =
        | 'numClients'
        | 'maxClients'
        | 'numRouterClients'
        | 'numRealms'
        | 'maxRealms'
      type hashFields = 'localClients' | 'remoteClients' | 'primaryRealms'
      type translatableFields =
        | 'localClients'
        | 'remoteClients'
        | 'primaryRealms'
      // ok I got a put request
      const toinsert: {
        url?: string
        wsurl?: string
        spki?: string
        key?: webcrypto.JsonWebKey
        changedAt?: Date
        region?: string
      } & Partial<Record<numericFields, number>> &
        Partial<Record<hashFields, string[]>> = {}
      try {
        toinsert.url = new URL(req.body.url).toString()
        toinsert.wsurl = new URL(req.body.wsurl).toString()
      } catch /*( error) */ {
        // not a valid url
        return res.status(401).send('malformed request, url')
      }
      if (req.body.spki && typeof req.body.spki === 'string') {
        toinsert.spki = req.body.spki
      } else {
        return res.status(401).send('malformed request, spki')
      }
      if (req.body.key) {
        try {
          toinsert.key = JSON.parse(req.body.key)
        } catch (error) {
          return res.status(401).send('malformed request, key json' + error)
        }
      } else {
        // console.log('malformes rquest debug', req.body)
        return res.status(401).send('malformed request, key')
      }

      const numCheck = (field: numericFields) => {
        if (
          !(
            req.body[field] !== undefined &&
            typeof req.body[field] === 'number' &&
            req.body[field] >= 0
          )
        ) {
          throw new Error('malformed request, ' + field)
        }
        toinsert[field] = req.body[field]
      }

      try {
        numCheck('numClients')
        numCheck('maxClients')
        numCheck('numRouterClients')
        numCheck('numRealms')
        numCheck('maxRealms')
      } catch (error) {
        return res.status(401).send('malformed request, ' + error)
      }

      const hashCheck = (field: hashFields) => {
        // console.log('hash check field', field, req.body[field])
        if (
          !(
            req.body[field] && // hashed values
            Array.isArray(req.body[field]) &&
            req.body[field].every(
              (el) => typeof el === 'string' && el.match(/^[0-9a-zA-Z_+:/=]+$/)
            )
          )
        )
          throw new Error('malformed request')
        toinsert[field] = req.body[field]
      }

      try {
        hashCheck('localClients')
        hashCheck('remoteClients')
        hashCheck('primaryRealms')
      } catch (error) {
        return res.status(401).send(error)
      }

      toinsert.changedAt = new Date()
      // we should update this every 30 seconds, the token should also live only 30 seconds
      const routercol = this.mongo.collection('avsrouters')

      try {
        const hashtable = await routercol.findOne(
          { url: toinsert.url },
          {
            projection: { transHash: 1 }
          }
        )
        const translateField = (field: translatableFields) => {
          if (
            hashtable &&
            hashtable.transHash &&
            hashtable.transHash instanceof Object
          ) {
            // console.log('translate field', field, toinsert[field], req.body)
            if (!toinsert[field]) return
            toinsert[field] = toinsert[field]
              .map((el) =>
                el.split(':').map((hash) => hashtable.transHash[hash])
              )
              .filter((id) => id.every((test) => test))
              .map((el2) => el2.join(':'))
          } else {
            delete toinsert[field]
          }
        }
        translateField('localClients')
        translateField('remoteClients')
        translateField('primaryRealms')
      } catch (error) {
        console.log('problem getting translation table', error)
        delete toinsert.localClients
        delete toinsert.remoteClients
        delete toinsert.primaryRealms
        return res.status(500).send('internal server problem')
      }
      const authreq = req as AuthenticatedRegionRequest

      if (!authreq.token.region)
        return res.status(401).send('malformed request no region in token')
      toinsert.region = authreq.token.region
      // TODO add region! at field region coming from authorization record
      try {
        // console.log('toinsert', toinsert)
        const upres = await routercol.updateOne(
          { url: toinsert.url },
          {
            $set: toinsert
          },
          { upsert: true }
        )

        if (upres.matchedCount === 0) return res.status(500).send('db error')
        if (upres.upsertedCount !== 0) {
          const hSA = await webcrypto.getRandomValues(new Uint8Array(16))
          const hashSalt = Buffer.from(
            hSA.buffer,
            hSA.byteOffset,
            hSA.byteLength
          ).toString('base64')
          // in this case, we have to add a hash value
          const hashres = await routercol.updateOne(
            { url: toinsert.url },
            {
              $set: { hashSalt }
            }
          )
          if (!(hashres.modifiedCount > 0)) {
            return res.status(500).send('db error hash')
          }
        }
        res.status(200).json({ successful: true })
      } catch (error) {
        console.log('update router info failed', error)
        return res.status(500).send('db error')
      }

      // TODO add region
    })
  }
}
