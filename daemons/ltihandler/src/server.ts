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

import express from 'express'
import {
  createClient as redisCreateClient,
  createCluster as redisCreateCluster,
  type RedisClusterType,
  type RedisClientType
} from 'redis'
import { MongoClient } from 'mongodb'
import { FailsJWTSigner } from '@fails-components/security'
import { FailsConfig } from '@fails-components/config'

// import { v4 as uuidv4, validate as isUUID } from 'uuid';
import { LtiHandler } from './ltihandler.ts'

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
const mongodb = mongoclient.db(cfg.mongoDB)

const keysSecret = cfg.keysSecret
if (typeof keysSecret === 'undefined')
  throw new Error('Secret for keys not set')

const appsecurity = new FailsJWTSigner({
  redis: rediscl,
  type: 'app',
  expiresIn: '1m',
  secret: keysSecret
})

const lmsList = cfg.lmsList

const ltihandler = new LtiHandler({
  lmslist: lmsList,
  signJwt: appsecurity.signToken,
  redis: rediscl,
  mongo: mongodb,
  basefailsurl: {
    stable: cfg.getURL('appweb', 'stable'),
    experimental: cfg.getURL('appweb', 'experimental')
  },
  coursewhitelist: cfg.courseWhitelist,
  onlyLearners: cfg.onlyLearners,
  addAdminList: cfg.addlAdmins
})

const app = express()
let ready: undefined | true

// may be move the io also inside the object, on the other hand, I can not insert middleware anymore

/* var ioIns = new Server(server,{cors: {
  origin: "http://192.168.1.116:3000",
  methods: ["GET", "POST"],
 // credentials: true
}}); */

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

console.log('debug path ', cfg.getSPath('lti') + '/launch')
app.all(cfg.getSPath('lti') + '/launch', (req, res) => {
  return ltihandler.handleLaunch(req, res)
})

app.all(cfg.getSPath('lti') + '/login', (req, res) => {
  return ltihandler.handleLogin(req, res)
})

// Kubernetes livelyness and readyness probes
app.get('/ready', (req, res) => {
  if (ready) return res.send('Ready')
  else res.status(500).send('Not ready')
})

app.get('/health', async (req, res) => {
  res.send('Healthy')
})

app.use(cfg.getSPath('lti') + '/maintenance/', ltihandler.maintenanceExpress()) // secure maintenance routes

app.get(cfg.getSPath('lti') + '/maintenance/user', (req, res) => {
  return ltihandler.handleGetUser(req, res)
})

app.delete(cfg.getSPath('lti') + '/maintenance/user', (req, res) => {
  return ltihandler.handleDeleteUser(req, res)
})

app.delete(cfg.getSPath('lti') + '/maintenance/course', (req, res) => {
  return ltihandler.handleDeleteCourse(req, res)
})

app.delete(cfg.getSPath('lti') + '/maintenance/resource', (req, res) => {
  return ltihandler.handleDeleteResource(req, res)
})

/*
// old test code?
app.all("/auth",function(req,res,next) {
  // console.log("Request:", req.token);
  // console.log("Res:",res);
   console.log("req.query auth",req.query);
   console.log("req.body auth",req.body);
   res.send('Hello LTI');
 });
 */

let port = cfg.getPort('lti')
if (port === 443) port = 8080 // we are in production mode inside a container
app.listen(port, cfg.host, function () {
  console.log(
    'Failsserver lti handler listening port:',
    port,
    ' host:',
    cfg.host
  )
  ready = true
})
