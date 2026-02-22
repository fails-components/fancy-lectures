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

import { createServer } from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import {
  createClient as redisCreateClient,
  createCluster as redisCreateCluster,
  type RedisClusterType,
  type RedisClientType
} from 'redis'
import { MongoClient } from 'mongodb'
import { NotesConnection } from './noteshandler.js'
import { FailsJWTSigner, FailsJWTVerifier } from '@fails-components/security'
import { FailsAssets } from '@fails-components/assets'
import { FailsConfig } from '@fails-components/config'

const cfg = new FailsConfig()

// this should be read only replica
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

// and yes pub sub is also read only so we need a mechanism for chat....
const redisclpub = rediscl.duplicate()
const redisclsub = rediscl.duplicate()

await Promise.all([redisclpub.connect(), redisclsub.connect()])

// again a read only replica should do...
const mongoclient = new MongoClient(cfg.mongoURL)
const mongodb = mongoclient.db(cfg.mongoDB)

const server = createServer()

const keysSecret = cfg.keysSecret
if (typeof keysSecret === 'undefined')
  throw new Error('Secret for keys not set')

const notessecurity = new FailsJWTSigner({
  redis: rediscl,
  type: 'notes',
  expiresIn: '10m',
  secret: keysSecret
})
const avssecurity = new FailsJWTSigner({
  redis: rediscl,
  type: 'avs',
  expiresIn: '1m',
  secret: keysSecret
})
const notesverifier = new FailsJWTVerifier({
  redis: rediscl,
  type: 'notes'
})
const statSecret = cfg.statSecret
if (typeof statSecret === 'undefined') throw new Error('Static secret not set')

const assets = new FailsAssets({
  datadir: cfg.dataDir,
  dataurl: cfg.getURL('data'),
  webservertype: cfg.WSType,
  privateKey: statSecret,
  swift: cfg.swift,
  s3: cfg.S3
})

// may be move the io also inside the object, on the other hand, I can not insert middleware anymore

let cors = cfg.needCors
  ? {
      origin: cfg.getURL('web'),
      methods: ['GET', 'POST']
      // credentials: true
    }
  : undefined

const ioIns = new Server(server, {
  cors: cors,
  path: '/notes.io',
  serveClient: false,
  transports: ['websocket'],
  pingInterval: 5000,
  pingTimeout: 3000
})
const notepadio = ioIns.of('/notepads')
const screenio = ioIns.of('/screens')
const notesio = ioIns.of('/notes')

ioIns.adapter(createAdapter(redisclpub, redisclsub))

const nsconn = new NotesConnection({
  redis: rediscl,
  mongo: mongodb,
  notepadio: notepadio,
  screenio: screenio,
  notesio: notesio,
  signNotesJwt: notessecurity.signToken,
  signAvsJwt: avssecurity.signToken,
  getFileURL: assets.getFileURL,
  noteshandlerURL: cfg.getURL('notes')
})

notesio.use(notesverifier.socketauthorize())
notesio.on('connection', (socket) => {
  nsconn.SocketHandlerNotes.bind(nsconn, socket)()
})

notepadio.use((socket, next) => {
  return next(new Error('no Connection possible'))
}) // this should not connect to notepad
screenio.use((socket, next) => {
  return next(new Error('no Connection possible'))
}) // this should not connect to screen

let port = cfg.getPort('notes')
if (port === 443) port = 8080 // we are in production mode inside a container

server.listen(port, cfg.host, function () {
  const address = server.address()
  if (address === null) return
  if (typeof address !== 'string') {
    console.log(
      'Failsserver listening at http://%s:%s',
      address.address,
      address.port
    )
  } else {
    console.log('Failsserver listening at', address)
  }
})
