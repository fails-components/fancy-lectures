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

function checkEnv(
  env: Record<string, string | undefined>,
  prop: string
): string {
  if (!env[prop]) throw new Error('Environment variable ' + prop + ' not set.')
  return env[prop]
}

export class FailsConfig {
  constructor(args: { react: boolean }) {
    if (args && args.react) this.react = true

    let env: Record<string, string | undefined>
    if (typeof process !== 'undefined' && process.env) {
      env = process.env
    } else env = (import.meta as any).env
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
      this.development_ = true
    }
    if (env.FAILS_LOCAL) {
      // string with all modules in debug mode
      this.devmode = env.FAILS_LOCAL.split(' ')
    }
    if (env.REDIS_HOST) {
      // string with all modules in debug mode
      this.redishost_ = env.REDIS_HOST
    } else {
      this.redishost_ = '127.0.0.1' // local host is the default
    }

    if (env.REDIS_PORT) {
      // string with all modules in debug mode
      this.redisport_ = Number(env.REDIS_PORT)
    } else {
      this.redisport_ = 6379 // default redisport
    }

    if (env.REDIS_PASS) {
      // string with all modules in debug mode
      this.redispass_ = env.REDIS_PASS
    }

    if (env.REACT_APP_FAILS_LOCAL) {
      // string with all modules in debug mode
      this.devmode = env.REACT_APP_FAILS_LOCAL.split(' ')
    }
    // console.log('dev mode', this.devmode)
    // console.log('process env', env)
    if (env.FAILS_DEV_IPHOST) {
      this.host_ = env.FAILS_DEV_IPHOST
    } else {
      this.host_ = '0.0.0.0'
    }

    if (env.FAILS_EXTERNAL_HOST) {
      this.exthost_ = env.FAILS_EXTERNAL_HOST
    } else {
      this.exthost_ = this.host_
    }

    if (env.FAILS_STATIC_WEBSERV_TYPE) {
      const wtype = env.FAILS_STATIC_WEBSERV_TYPE
      if (!['local', 'nginx', 'openstackswift', 's3'].includes(wtype))
        throw new Error('Unsupported FAILS_STATIC_WEBSERV_TYPE')
      this.statwebservertype_ = wtype as typeof this.statwebservertype_
    } else {
      this.statwebservertype_ = 'local'
    }

    if (env.FAILS_STATIC_SAVE_TYPE) {
      const stype = env.FAILS_STATIC_SAVE_TYPE
      if (!['fs', 'openstackswift', 's3'].includes(stype))
        throw new Error('Unsupported FAILS_FAILS_STATIC_SAVE_TYPE')
      this.statsavetype_ = stype as typeof this.statsavetype_
    } else {
      this.statsavetype_ = 'fs'
    }

    if (
      env.FAILS_STATIC_WEBSERV_TYPE === 'openstackswift' ||
      env.FAILS_STATIC_SAVE_TYPE === 'openstackswift'
    ) {
      this.swift_ = {
        account: checkEnv(env, 'FAILS_SWIFT_ACCOUNT'),
        container: checkEnv(env, 'FAILS_SWIFT_CONTAINER'),
        key: checkEnv(env, 'FAILS_SWIFT_KEY'),
        baseurl: checkEnv(env, 'FAILS_SWIFT_BASEURL'),
        authbaseurl: checkEnv(env, 'FAILS_SWIFT_AUTH_BASEURL'),
        username: checkEnv(env, 'FAILS_SWIFT_USERNAME'),
        password: checkEnv(env, 'FAILS_SWIFT_PASSWORD'),
        domain: checkEnv(env, 'FAILS_SWIFT_DOMAIN'),
        project: checkEnv(env, 'FAILS_SWIFT_PROJECT')
      }
    }

    if (
      env.FAILS_STATIC_WEBSERV_TYPE === 's3' ||
      env.FAILS_STATIC_SAVE_TYPE === 's3'
    ) {
      this.s3_ = {
        AK: checkEnv(env, 'FAILS_S3_AK'),
        SK: checkEnv(env, 'FAILS_S3_SK'),
        region: checkEnv(env, 'FAILS_S3_REGION'),
        bucket: checkEnv(env, 'FAILS_S3_BUCKET'),
        host: checkEnv(env, 'FAILS_S3_HOST'),
        alturl: checkEnv(env, 'FAILS_S3_ALTURL')
      }
    }

    if (env.FAILS_MONGO_URL) this.mongourl_ = checkEnv(env, 'FAILS_MONGO_URL')
    else this.mongourl_ = 'mongodb://localhost:27017'

    if (env.FAILS_MONGO_DBNAME)
      this.mongoname_ = checkEnv(env, 'FAILS_MONGO_DBNAME')
    else this.mongoname_ = 'fails'

    if (env.FAILS_STATIC_SECRET) this.staticsecret_ = env.FAILS_STATIC_SECRET
    else if (!this.react) throw new Error('Please specifiy FAILS_STATIC_SECRET')

    if (env.FAILS_KEYS_SECRET) this.keyssecret_ = env.FAILS_KEYS_SECRET
    else if (!this.react) throw new Error('Please specifiy FAILS_KEYS_SECRET')

    // eslint-disable-next-line camelcase
    this.lms_list_ = {}
    if (env.FAILS_LMS_LIST) {
      const lmss = env.FAILS_LMS_LIST.split(' ')
      for (let i = 0; i < lmss.length; i++) {
        const lms = lmss[i]
        const lmsarr = lms.split('|')
        if (lmsarr.length !== 5) throw new Error('FAILS_LMS_LIST wrong format')
        const newone = {
          // eslint-disable-next-line camelcase
          keyset_url: lmsarr[1],
          // eslint-disable-next-line camelcase
          access_token_url: lmsarr[2],

          // eslint-disable-next-line camelcase
          auth_request_url: lmsarr[3]
        }
        const name = lmsarr[4]
        if (
          !newone.keyset_url ||
          !newone.access_token_url ||
          !newone.auth_request_url ||
          !name
        ) {
          throw new Error('FAILS_LMS ' + lms + 'not completely set!')
        }
        this.lms_list_[name] = newone
      }
    }

    if (env.FAILS_LMS_COURSE_WHITELIST) {
      this.courseidWhitelist_ = env.FAILS_LMS_COURSE_WHITELIST.split(' ')
    }

    if (env.FAILS_ONLY_LEARNERS === '1') {
      this.onlylearners_ = true
    } else {
      this.onlylearners_ = false
    }

    if (env.FAILS_ADDL_ADMINS) {
      this.addladmins_ = env.FAILS_ADDL_ADMINS.split(' ')
    } else {
      this.addladmins_ = []
    }

    if (
      env.FAILS_ADMIN_EMAIL_SERVER &&
      process.env.FAILS_ADMIN_EMAIL_SENDER_ADDRESS
    ) {
      this.nodemailerconfig_ = {
        host: env.FAILS_ADMIN_EMAIL_SERVER,
        port: Number(env.FAILS_ADMIN_EMAIL_SERVER_PORT),
        secure: env.secure === '1',
        auth: {
          user: env.FAILS_ADMIN_EMAIL_ACCOUNT_NAME,
          pass: env.FAILS_ADMIN_EMAIL_ACCOUNT_PASSWORD
        }
      }
      if (process.env.FAILS_ADMIN_EMAIL_ROOT_ADDRESSES) {
        this.rootemails_ =
          process.env.FAILS_ADMIN_EMAIL_ROOT_ADDRESSES.split(',')
      }
      this.senderaddress_ = process.env.FAILS_ADMIN_EMAIL_SENDER_ADDRESS
    }
  }

  get onlyLearners() {
    return this.onlylearners_
  }

  get addlAdmins() {
    return this.addladmins_
  }

  get nodemailerConfig() {
    return this.nodemailerconfig_
  }

  get rootEmails() {
    return this.rootemails_
  }

  get senderAddress() {
    return this.senderaddress_
  }

  get courseWhitelist() {
    return this.courseidWhitelist_
  }

  get redisHost() {
    return this.redishost_
  }

  get redisPort() {
    return this.redisport_
  }

  get redisPass() {
    return this.redispass_
  }

  get needCors() {
    if (this.devmode && this.devmode.includes('appweb')) return true
    else return false
  }

  get devPorts(): Record<string, number> {
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

  get lmsList() {
    return this.lms_list_
  }

  get statSaveType() {
    return this.statsavetype_
  }

  get mongoURL() {
    return this.mongourl_
  }

  mongoDB() {
    return this.mongoname_
  }

  get WSType() {
    return this.statwebservertype_
  }

  get keysSecret() {
    return this.keyssecret_
  }

  get statSecret() {
    return this.staticsecret_
  }

  getPath(type: string, branch: string) {
    const paths: Record<string, string> = {
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

  get host() {
    return this.host_
  }

  get eHost() {
    return this.exthost_
  }

  getSPath(type: string, branch: string) {
    const path = this.getPath(type, branch)
    if (path === '') return ''
    else return '/' + this.getPath(type, branch)
  }

  get dataDir() {
    return 'files'
  }

  get sDataDir() {
    return '/' + this.dataDir
  }

  getPort(type: string) {
    if (this.devmode && this.devmode.includes(type)) {
      const name = 'FAILS_DEV_' + type.toUpperCase() + '_PORT'
      if (this.env[name]) {
        return this.env[name]
      }
      if (this.env['REACT_APP_' + name]) {
        return this.env['REACT_APP_' + name]
      }
      if (this.devPorts[type]) return this.devPorts[type]
    }
    return 443 // https
  }

  get swift() {
    return this.swift_
  }

  get S3() {
    return this.s3_
  }

  isHttps(port: number) {
    return port === 443
  }

  getURL(type: string, branch: string) {
    const port = this.getPort(type)
    const ishttps = port ? this.isHttps(Number(port)) : false
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

  get development() {
    return this.development_
  }

  private react?: boolean
  private env: Record<string, string | undefined>
  private development_: boolean | undefined
  private devmode?: string[]
  private redishost_: string
  private redisport_: number
  private redispass_?: string
  private host_: string
  private exthost_: string
  private statwebservertype_: 'local' | 'nginx' | 'openstackswift' | 's3'
  private statsavetype_: 'fs' | 'openstackswift' | 's3'
  private swift_:
    | {
        account: string
        container: string
        key: string
        baseurl: string
        authbaseurl: string
        username: string
        password: string
        domain: string
        project: string
      }
    | undefined
  private s3_?: {
    AK: string
    SK: string
    region: string
    bucket: string
    host: string
    alturl: string
  }
  private mongourl_: string
  private mongoname_: string
  private staticsecret_?: string
  private keyssecret_?: string
  // eslint-disable-next-line camelcase
  private lms_list_: Record<
    string,
    {
      keyset_url: string
      access_token_url: string
      auth_request_url: string
    }
  >
  private courseidWhitelist_?: string[]
  private onlylearners_: boolean
  private addladmins_: string[]
  private nodemailerconfig_?: {
    host: string
    port: number
    secure: boolean
    auth: { user?: string; pass?: string }
  }
  private rootemails_?: string[]
  private senderaddress_?: string
}
