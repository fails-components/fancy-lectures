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
import { MongoClient } from 'mongodb'
import { AVSDispatcher } from './dispatcher.js'
import { FailsConfig } from '@fails-components/config'
import { FailsJWTVerifier, FailsJWTSigner } from '@fails-components/security'
import cors from 'cors'
import {
  createClient as redisCreateClient,
  createCluster as redisCreateCluster,
  type RedisClusterType,
  type RedisClientType
} from 'redis'

console.log('start initialize server')

const cfg = new FailsConfig()

let rediscl: RedisClusterType | RedisClientType
let redisclusterconfig
if (cfg.redisClusterConfig) redisclusterconfig = cfg.redisClusterConfig
if (!redisclusterconfig) {
  console.log(
    'Connect to redis database with host:',
    cfg.redisHost,
    'and port:',
    cfg.redisPort
  )
  rediscl = redisCreateClient({
    socket: { port: cfg.redisPort, host: cfg.redisHost },
    password: cfg.redisPass
  })
} else {
  // cluster case
  console.log('Connect to redis cluster with config:', redisclusterconfig)
  rediscl = redisCreateCluster(redisclusterconfig)
}

await rediscl.connect()
console.log('redisclient connected')

const mongoclient = new MongoClient(cfg.mongoURL)
await mongoclient.connect()
const mongodb = mongoclient.db(cfg.mongoDB)

let ready = false

const avsverifier = new FailsJWTVerifier({ redis: rediscl, type: 'avs' })

const keysSecret = cfg.keysSecret
if (typeof keysSecret === 'undefined')
  throw new Error('Secret for keys not set')

const avssecurity = new FailsJWTSigner({
  redis: rediscl,
  type: 'avs',
  expiresIn: '1m',
  secret: keysSecret
})

const dispatcher = new AVSDispatcher({
  mongo: mongodb,
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
app.listen(port, cfg.host, function () {
  console.log(
    'Failsserver avsdispatcher handler listening port:',
    port,
    ' host:',
    cfg.host
  )
  ready = true
})
