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

export class FailsConfig {
  constructor(args) {
    if (args && args.react) this.react = true

    let env
    if (typeof process !== 'undefined' && process.env) {
      env = process.env
    } else env = import.meta.env
    if (!env) {
      // webpack compatibility mode, to be removed later
      env = {
        NODE_ENV: process.env.NODE_ENV,
        FAILS_LOCAL: process.env.FAILS_LOCAL,
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASS: process.env.REDIS_PASS,
        REACT_APP_FAILS_LOCAL: process.env.REACT_APP_FAILS_LOCAL,
        FAILS_DEV_IPHOST: process.env.FAILS_DEV_IPHOST,
        FAILS_EXTERNAL_HOST: process.env.FAILS_EXTERNAL_HOST,
        FAILS_STATIC_WEBSERV_TYPE: process.env.FAILS_STATIC_WEBSERV_TYPE,
        FAILS_STATIC_SAVE_TYPE: process.env.FAILS_STATIC_SAVE_TYPE,
        FAILS_SWIFT_ACCOUNT: process.env.FAILS_SWIFT_ACCOUNT,
        FAILS_SWIFT_CONTAINER: process.env.FAILS_SWIFT_CONTAINER,
        FAILS_SWIFT_KEY: process.env.FAILS_SWIFT_KEY,
        FAILS_SWIFT_BASEURL: process.env.FAILS_SWIFT_BASEURL,
        FAILS_SWIFT_AUTH_BASEURL: process.env.FAILS_SWIFT_AUTH_BASEURL,
        FAILS_SWIFT_USERNAME: process.env.FAILS_SWIFT_USERNAME,
        FAILS_SWIFT_PASSWORD: process.env.FAILS_SWIFT_PASSWORD,
        FAILS_SWIFT_DOMAIN: process.env.FAILS_SWIFT_DOMAIN,
        FAILS_SWIFT_PROJECT: process.env.FAILS_SWIFT_PROJECT,
        FAILS_S3_AK: process.env.FAILS_S3_AK,
        FAILS_S3_SK: process.env.FAILS_S3_SK,
        FAILS_S3_REGION: process.env.FAILS_S3_REGION,
        FAILS_S3_BUCKET: process.env.FAILS_S3_BUCKET,
        FAILS_S3_HOST: process.env.FAILS_S3_HOST,
        FAILS_S3_ALTURL: process.env.FAILS_S3_ALTURL,
        FAILS_MONGO_URL: process.env.FAILS_MONGO_URL,
        FAILS_MONGO_DBNAME: process.env.FAILS_MONGO_DBNAME,
        FAILS_STATIC_SECRET: process.env.FAILS_STATIC_SECRET,
        FAILS_KEYS_SECRET: process.env.FAILS_KEYS_SECRET,
        FAILS_LMS_LIST: process.env.FAILS_LMS_LIST,
        FAILS_LMS_COURSE_WHITELIST: process.env.FAILS_LMS_COURSE_WHITELIST,
        FAILS_ONLY_LEARNERS: process.env.FAILS_ONLY_LEARNERS,
        FAILS_ADDL_ADMINS: process.env.FAILS_ADDL_ADMINS,
        FAILS_ADMIN_EMAIL_SERVER: process.env.FAILS_ADMIN_EMAIL_SERVER,
        FAILS_ADMIN_EMAIL_SERVER_PORT:
          process.env.FAILS_ADMIN_EMAIL_SERVER_PORT,
        FAILS_ADMIN_EMAIL_SENDER_ADDRESS:
          process.env.FAILS_ADMIN_EMAIL_SENDER_ADDRESS,
        FAILS_ADMIN_EMAIL_ROOT_ADDRESSES:
          process.env.FAILS_ADMIN_EMAIL_ROOT_ADDRESSES,
        FAILS_ADMIN_EMAIL_ACCOUNT_NAME:
          process.env.FAILS_ADMIN_EMAIL_ACCOUNT_NAME,
        FAILS_ADMIN_EMAIL_ACCOUNT_PASSWORD:
          process.env.FAILS_ADMIN_EMAIL_ACCOUNT_PASSWORD,
        FAILS_ADMIN_EMAIL_SECURE: process.env.FAILS_ADMIN_EMAIL_SECURE
      }
    }
    this.env = env

    if (env.NODE_ENV === 'development') {
      this.development = true
    }
    if (env.FAILS_LOCAL) {
      // string with all modules in debug mode
      this.devmode = env.FAILS_LOCAL.split(' ')
    }
    if (env.REDIS_HOST) {
      // string with all modules in debug mode
      this.redishost = env.REDIS_HOST
    } else {
      this.redishost = '127.0.0.1' // local host is the default
    }

    if (env.REDIS_PORT) {
      // string with all modules in debug mode
      this.redisport = env.REDIS_PORT
    } else {
      this.redisport = 6379 // default redisport
    }

    if (env.REDIS_PASS) {
      // string with all modules in debug mode
      this.redispass = env.REDIS_PASS
    }

    if (env.REACT_APP_FAILS_LOCAL) {
      // string with all modules in debug mode
      this.devmode = env.REACT_APP_FAILS_LOCAL.split(' ')
    }
    // console.log('dev mode', this.devmode)
    // console.log('process env', env)
    if (env.FAILS_DEV_IPHOST) {
      this.host = env.FAILS_DEV_IPHOST
    } else {
      this.host = '0.0.0.0'
    }

    if (env.FAILS_EXTERNAL_HOST) {
      this.exthost = env.FAILS_EXTERNAL_HOST
    } else {
      this.exthost = this.host
    }

    if (env.FAILS_STATIC_WEBSERV_TYPE) {
      this.statwebservertype = env.FAILS_STATIC_WEBSERV_TYPE
    } else {
      this.statwebservertype = 'local'
    }

    if (env.FAILS_STATIC_SAVE_TYPE) {
      this.statsavetype = env.FAILS_STATIC_SAVE_TYPE
    } else {
      this.statsavetype = 'fs'
    }

    if (
      env.FAILS_STATIC_WEBSERV_TYPE === 'openstackswift' ||
      env.FAILS_STATIC_SAVE_TYPE === 'openstackswift'
    ) {
      this.swift = {}
      const sw = this.swift
      sw.account = env.FAILS_SWIFT_ACCOUNT
      sw.container = env.FAILS_SWIFT_CONTAINER
      sw.key = env.FAILS_SWIFT_KEY
      sw.baseurl = env.FAILS_SWIFT_BASEURL
      sw.authbaseurl = env.FAILS_SWIFT_AUTH_BASEURL
      sw.username = env.FAILS_SWIFT_USERNAME
      sw.password = env.FAILS_SWIFT_PASSWORD
      sw.domain = env.FAILS_SWIFT_DOMAIN
      sw.project = env.FAILS_SWIFT_PROJECT
    }

    if (
      env.FAILS_STATIC_WEBSERV_TYPE === 's3' ||
      env.FAILS_STATIC_SAVE_TYPE === 's3'
    ) {
      this.s3 = {}
      const s3 = this.s3
      s3.AK = env.FAILS_S3_AK
      s3.SK = env.FAILS_S3_SK
      s3.region = env.FAILS_S3_REGION
      s3.bucket = env.FAILS_S3_BUCKET
      s3.host = env.FAILS_S3_HOST
      s3.alturl = env.FAILS_S3_ALTURL
    }

    if (env.FAILS_MONGO_URL) this.mongourl = env.FAILS_MONGO_URL
    else this.mongourl = 'mongodb://localhost:27017'

    if (env.FAILS_MONGO_DBNAME) this.mongoname = env.FAILS_MONGO_DGNAME
    else this.mongoname = 'fails'

    if (env.FAILS_STATIC_SECRET) this.staticsecret = env.FAILS_STATIC_SECRET
    else if (!this.react) throw new Error('Please specifiy FAILS_STATIC_SECRET')

    if (env.FAILS_KEYS_SECRET) this.keyssecret = env.FAILS_KEYS_SECRET
    else if (!this.react) throw new Error('Please specifiy FAILS_KEYS_SECRET')

    this.lms_list = {}
    if (env.FAILS_LMS_LIST) {
      const lmss = env.FAILS_LMS_LIST.split(' ')
      for (let i = 0; i < lmss.length; i++) {
        const lms = lmss[i]
        const lmsarr = lms.split('|')
        if (lmsarr.length !== 5) throw new Error('FAILS_LMS_LIST wrong format')
        const newone = {}
        newone.keyset_url = lmsarr[1]
        newone.access_token_url = lmsarr[2]

        newone.auth_request_url = lmsarr[3]
        const name = lmsarr[4]
        if (
          !newone.keyset_url ||
          !newone.access_token_url ||
          !newone.auth_request_url ||
          !name
        ) {
          throw new Error('FAILS_LMS ' + lms + 'not completely set!')
        }
        this.lms_list[name] = newone
      }
    }

    if (env.FAILS_LMS_COURSE_WHITELIST) {
      this.courseidWhitelist = env.FAILS_LMS_COURSE_WHITELIST.split(' ')
    }

    if (env.FAILS_ONLY_LEARNERS === '1') {
      this.onlylearners = true
    } else {
      this.onlylearners = false
    }

    if (env.FAILS_ADDL_ADMINS) {
      this.addladmins = env.FAILS_ADDL_ADMINS.split(' ')
    } else {
      this.addladmins = []
    }

    if (
      env.FAILS_ADMIN_EMAIL_SERVER &&
      process.env.FAILS_ADMIN_EMAIL_SENDER_ADDRESS
    ) {
      this.nodemailerconfig = {
        host: env.FAILS_ADMIN_EMAIL_SERVER,
        port: env.FAILS_ADMIN_EMAIL_SERVER_PORT,
        secure: env.secure === '1',
        auth: {
          user: env.FAILS_ADMIN_EMAIL_ACCOUNT_NAME,
          pass: env.FAILS_ADMIN_EMAIL_ACCOUNT_PASSWORD
        }
      }
      if (process.env.FAILS_ADMIN_EMAIL_ROOT_ADDRESSES) {
        this.rootemails =
          process.env.FAILS_ADMIN_EMAIL_ROOT_ADDRESSES.split(',')
      }
      this.senderaddress = process.env.FAILS_ADMIN_EMAIL_SENDER_ADDRESS
    }
  }

  onlyLearners() {
    return this.onlylearners
  }

  addlAdmins() {
    return this.addladmins
  }

  nodemailerConfig() {
    return this.nodemailerconfig
  }

  rootEmails() {
    return this.rootemails
  }

  senderAddress() {
    return this.senderaddress
  }

  courseWhitelist() {
    return this.courseidWhitelist
  }

  redisHost() {
    return this.redishost
  }

  redisPort() {
    return this.redisport
  }

  redisPass() {
    return this.redispass
  }

  needCors() {
    if (this.devmode && this.devmode.includes('appweb')) return true
    else return false
  }

  devPorts() {
    // default ports for development, if not in container
    return {
      web: 3000,
      appweb: 1001,
      app: 9092,
      notepad: 9090,
      screen: 9090,
      lti: 9091,
      demo: 9094,
      notes: 9093,
      data: 9092,
      avsdispatcher: 9093
    }
  }

  getLmsList() {
    return this.lms_list
  }

  getStatSaveType() {
    return this.statsavetype
  }

  getMongoURL() {
    return this.mongourl
  }

  getMongoDB() {
    return this.mongoname
  }

  getWSType() {
    return this.statwebservertype
  }

  getKeysSecret() {
    return this.keyssecret
  }

  getStatSecret() {
    return this.staticsecret
  }

  getPath(type, branch) {
    const paths = {
      web: 'static/lecture/',
      app: 'app',
      appweb: 'static/app/',
      notepad: '',
      screen: '',
      notes: '',
      lti: 'lti',
      demo: 'demo',
      data: '',
      avsdispatcher: 'avs'
    }
    if (
      this.devmode &&
      !(type === 'lti' || type === 'demo' || type === 'avsdispatcher')
    )
      return ''

    let toret
    if (paths[type]) {
      toret = paths[type]
    } else toret = ''

    if (branch && branch !== 'stable') {
      toret = toret.replace('static/', 'static/' + branch + '/')
    }

    return toret
  }

  getHost() {
    return this.host
  }

  getEHost() {
    return this.exthost
  }

  getSPath(type, branch) {
    const path = this.getPath(type, branch)
    if (path === '') return ''
    else return '/' + this.getPath(type, branch)
  }

  getDataDir() {
    return 'files'
  }

  getSDataDir() {
    return '/' + this.getDataDir()
  }

  getPort(type) {
    if (this.devmode && this.devmode.includes(type)) {
      const name = 'FAILS_DEV_' + type.toUpperCase() + '_PORT'
      if (this.env[name]) {
        return this.env[name]
      }
      if (this.env['REACT_APP_' + name]) {
        return this.env['REACT_APP_' + name]
      }
      if (this.devPorts()[type]) return this.devPorts()[type]
    }
    return 443 // https
  }

  getSwift() {
    return this.swift
  }

  getS3() {
    return this.s3
  }

  isHttps(port) {
    return port === 443
  }

  getURL(type, branch) {
    const port = this.getPort(type)
    const ishttps = this.isHttps(port)
    if (this.devmode && this.devmode.includes(type)) {
      return (
        (ishttps ? 'https://' : 'http://') +
        this.host +
        (port === 443 ? '' : ':' + port) +
        this.getSPath(type, branch)
      )
    } else {
      return '/' + this.getPath(type, branch) // absolute url without domain
    }
  }
}
