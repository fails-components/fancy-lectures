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
  createClient as redisCreateClient,
  createCluster as redisCreateCluster,
  type RedisClusterType,
  type RedisClientType
} from 'redis'
import { MongoClient } from 'mongodb'
import { Housekeeping } from './housekeeper.ts'
import { writeFile, rm } from 'node:fs/promises'
import { FailsConfig } from '@fails-components/config'
import { FailsAssets } from '@fails-components/assets'
import { CronJob } from 'cron'
import { createTransport } from 'nodemailer'

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

let mailtransport
const rootemails = cfg.rootEmails
{
  const nodemailerConfig = cfg.nodemailerConfig
  if (nodemailerConfig) {
    mailtransport = createTransport(nodemailerConfig)
    if (!rootemails) {
      throw new Error(
        'Empty root email sender config, but SMTP sever activated'
      )
    }
  }
}

const statSecret = cfg.statSecret
if (typeof statSecret === 'undefined') throw new Error('Static secret not set')

const assets = new FailsAssets({
  datadir: cfg.dataDir,
  dataurl: cfg.getURL('data'),
  webservertype: cfg.WSType,
  savefile: cfg.statSaveType,
  privateKey: statSecret,
  swift: cfg.swift,
  s3: cfg.S3
})

const hk = new Housekeeping({
  redis: rediscl,
  mongo: mongodb,
  deleteAsset: assets.shadelete,
  setupAssets: assets.setupAssets,
  mailtransport,
  senderaddress: cfg.senderAddress,
  rootemails
})

let hklocktime = 0
new CronJob(
  '35 * * * * *',
  () => {
    console.log('Start house keeping')
    if (Date.now() - hklocktime > 1000 * 40) {
      hklocktime = Date.now()
      writeFile('/tmp/healthy.txt', 'ok').catch((error) => {
        console.log('Writing health file failed.', error)
      })
      hk.houseKeeping().catch((error) => {
        console.log('Problem with housekeeping:', error)
        rm('/tmp/healthy.txt').catch((error) => {
          console.log('Removing health file failed.', error)
        })
      })
    } else {
      console.log('housekeeping blocked')
      rm('/tmp/healthy.txt').catch((error) => {
        console.log('Removing health file failed.', error)
      })
    }
    console.log('End house keeping')
  },
  null,
  true
) // run it every minute

new CronJob(
  '15 * * * * *',
  () => {
    console.log('Start checking for cloud alarm state')
    hk.checkCloudStatus().catch((error) => {
      console.log('check cloud status failed:', error)
    })
    console.log('End checking for cloud alarm state')
  },
  null,
  true
)
