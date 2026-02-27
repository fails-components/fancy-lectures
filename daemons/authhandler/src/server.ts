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
import {
  createClient as redisCreateClient,
  createCluster as redisCreateCluster,
  type RedisClusterType,
  type RedisClientType
} from 'redis'
import { AuthConnection } from './authhandler.ts'
import { FailsJWTSigner } from '@fails-components/security'
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

const server = createServer()

const keysSecret = cfg.keysSecret
if (typeof keysSecret === 'undefined')
  throw new Error('Secret for keys not set')

const lecturesecurity = new FailsJWTSigner({
  redis: rediscl,
  type: 'lecture',
  expiresIn: '10m',
  secret: keysSecret
})
const screensecurity = new FailsJWTSigner({
  redis: rediscl,
  type: 'screen',
  expiresIn: '10m',
  secret: keysSecret
})
const notessecurity = new FailsJWTSigner({
  redis: rediscl,
  type: 'notes',
  expiresIn: '10m',
  secret: keysSecret
})

// may be move the io also inside the object, on the other hand, I can not insert middleware anymore

let cors:
  | undefined
  | {
      origin: string
      methods: string[]
    } = undefined

if (cfg.needCors) {
  cors = {
    origin: cfg.getURL('web'),
    methods: ['GET', 'POST']
    // credentials: true
  }
}

const ioIns = new Server(server, {
  cors: cors,
  path: '/auth.io',
  serveClient: false,
  transports: ['websocket']
})
const authio = ioIns.of('/auth')

await rediscl.connect()

const nsconn = new AuthConnection({
  redis: rediscl,
  authio: authio,
  signScreenJwt: screensecurity.signToken,
  signNotepadJwt: lecturesecurity.signToken,
  signNotesJwt: notessecurity.signToken,
  notepadhandlerURL: cfg.getURL('notepad'),
  noteshandlerURL: cfg.getURL('notes'),
  authhandlerURL: cfg.getURL('auth')
})

// no verification this is login, thus unauthorized!
// authio.use(authverifier.socketauthorize())
authio.on('connection', (socket) => {
  nsconn.SocketHandlerAuth.bind(nsconn, socket)()
})

let port = cfg.getPort('auth')
if (port === 443) port = 8080 // we are in production mode inside a container

server.listen(port, cfg.host, function () {
  const address = server.address()
  if (address === null) return
  if (typeof address !== 'string') {
    console.log(
      'Failsserver auth listening at http://%s:%s',
      address.address,
      address.port
    )
  } else {
    console.log('Failsserver auth listening at', address)
  }
})
