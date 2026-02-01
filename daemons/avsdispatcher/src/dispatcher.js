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

export class AVSDispatcher {
  constructor(args) {
    this.mongo = args.mongo
    this.redis = args.redis
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
                type: 'Point',
                coordinates: [posarr[0], posarr[1]]
              }
          })
          .filter((el) => el !== undefined),
        changedAt: new Date()
      }))

    try {
      const regioncol = this.mongo.collection('avsregion')
      const insertprom = regions.map(async (el) => {
        try {
          await regioncol.updateOne(
            { name: el.name },
            {
              $set: el
            },
            { upsert: true }
          )
        } catch (error) {
          console.log('error db regio update', error)
        }
      })

      await Promise.all(insertprom)
      const regionByName = {}
      regions.forEach((el) => {
        el.fetchTime = Date.now()
        regionByName[el.name] = el
      })
      this.regions = regionByName
    } catch (error) {
      console.log('error db regio update all', error)
    }
  }

  async fetchRegion(region) {
    const regioncol = this.mongo.collection('avsregion')
    const regdoc = await regioncol.findOne({ name: region })
    if (regdoc) {
      if (regdoc.hmac && regdoc.hmac.buffer) regdoc.hmac = regdoc.hmac.buffer
      this.regions[region] = regdoc
      this.regions[region].fetchTime = Date.now()
    }
  }

  express() {
    const secretCallback = async (req, token) => {
      const region = token.payload.region
      if (token.payload.region !== token.header.kid)
        throw new Error('kid region mismatch')
      if (!region) throw new Error('no region provided')
      if (
        !this.regions[region] ||
        this.regions[region].fetchTime + 1000 * 60 * 2 < Date.now()
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

  installHandlers(path, app) {
    // renew the auth token
    app.get(path + '/key', async (req, res) => {
      // console.log('get key ', req.query)
      if (
        !(
          req.query.kid &&
          req.query.kid.match(/^[0-9a-zA-Z]+$/) &&
          typeof req.query.kid === 'string'
        )
      )
        return res.status(401).send('malformed request')
      try {
        const pubkey = await this.verifier.getPublicKey(req.query.kid)

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
      // ok I got a put request
      const toinsert = {}
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
          return res.status(401).send('malformed request, key json', error)
        }
      } else {
        // console.log('malformes rquest debug', req.body)
        return res.status(401).send('malformed request, key')
      }
      const numCheck = (field) => {
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

      const hashCheck = (field) => {
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
        const translateField = (field) => {
          if (
            hashtable &&
            hashtable.transHash &&
            hashtable.transHash instanceof Object
          ) {
            // console.log('translate field', field, toinsert[field], req.body)
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

      if (!req.token.region)
        return res.status(401).send('malformed request no region in token')
      toinsert.region = req.token.region
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

        if (upres.result.n === 0) return res.status(500).send('db error')
        if (upres.result.upserted) {
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
