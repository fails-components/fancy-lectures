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

import express from 'express'
import MongoClient from 'mongodb'
import { AVSDispatcher } from './dispatcher.js'
import { FailsConfig } from '@fails-components/config'
import { FailsJWTVerifier, FailsJWTSigner } from '@fails-components/security'
import cors from 'cors'
import * as redis from 'redis'

const initServer = async () => {
  console.log('start initialize server')

  const cfg = new FailsConfig()

  const redisclient = redis.createClient({
    socket: { port: cfg.redisPort(), host: cfg.redisHost() },
    password: cfg.redisPass()
  })

  await redisclient.connect()
  console.log('redisclient connected')

  const mongoclient = await MongoClient.connect(cfg.getMongoURL(), {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const mongodb = mongoclient.db(cfg.getMongoDB())

  let ready = false

  const avsverifier = new FailsJWTVerifier({ redis: redisclient, type: 'avs' })

  const avssecurity = new FailsJWTSigner({
    redis: redisclient,
    type: 'avs',
    expiresIn: '1m',
    secret: cfg.getKeysSecret()
  })

  const dispatcher = new AVSDispatcher({
    mongo: mongodb,
    redis: redisclient,
    verifier: avsverifier,
    signAvsJwt: avssecurity.signToken
  })

  const app = express()
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())

  // only in development!
  if (cfg.devmode) {
    app.use(cors())
  }

  // Kubernetes livelyness and readyness probes
  app.get('/ready', (req, res) => {
    if (ready) return res.send('Ready')
    else res.status(500).send('Not ready')
  })

  app.get('/health', async (req, res) => {
    res.send('Healthy')
  })

  app.use(cfg.getSPath('avsdispatcher'), dispatcher.express()) // secure all app routes
  dispatcher.installHandlers(cfg.getSPath('avsdispatcher'), app)

  let port = cfg.getPort('avsdispatcher')
  if (port === 443) port = 8080 // we are in production mode inside a container
  app.listen(port, cfg.getHost(), function () {
    console.log(
      'Failsserver avsdispatcher handler listening port:',
      port,
      ' host:',
      cfg.getHost()
    )
    ready = true
  })
}
initServer()
