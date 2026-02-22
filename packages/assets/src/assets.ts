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

import { Busboy } from '@fastify/busboy'
import { createHash, createHmac } from 'node:crypto'
import { Transform, Readable } from 'node:stream'
import { writeFile, mkdir, rm, stat, readdir, open, rename } from 'fs/promises'
import axios, { type ResponseType } from 'axios'
import { XMLParser } from 'fast-xml-parser'
import { randomUUID } from 'crypto'
import { finished } from 'stream/promises'
import type { PathLike } from 'node:fs'
import type { Request } from 'express'

type AssstesOptions = {
  datadir: string
  dataurl: string
  webservertype: 'local' | 'nginx' | 'openstackswift' | 's3'
  savefile: 'fs' | 'openstackswift' | 's3'
  privateKey: string
  swift?: {
    account: string
    container: string
    key: string
    baseurl: string
    authbaseurl?: string
    username?: string
    password?: string
    domain: string | undefined
    project: string | undefined
  }
  s3?: {
    AK: string
    SK: string
    region: string
    bucket: string
    host: string
    alturl?: string | undefined
  }
}

type OpenstackToken = {
  token: string
  tokeninfo: Record<string, any>
  expire: number
}

interface S3Headers {
  Date: string
  Host: string
  'x-amz-content-sha256': string
  Authorization?: string
}

interface BusBoyFile {
  filename: string
  stream: Readable
  fieldname: string
  transferEncoding: string
  mimeType: string
  size: number
}

export class FailsAssets {
  private datadir: string
  private dataurl: string
  private webservertype: 'local' | 'nginx' | 'openstackswift' | 's3'
  private savefile: 'fs' | 'openstackswift' | 's3'
  private privateKey: string
  // swift webserver
  private swiftaccount?: string
  private swiftcontainer?: string
  private swiftkey?: string
  private swiftbaseurl?: string
  private swiftauthbaseurl?: string
  // swift save
  private swiftusername?: string
  private swiftpassword?: string
  private swiftdomain?: string
  private swiftproject?: string

  private ostoken?: Promise<OpenstackToken>
  // s3 config
  private s3AK?: string
  private s3SK?: string
  private s3region?: string
  private s3bucket?: string
  private s3host?: string
  private s3alturl?: string

  private xmlparser: XMLParser
  private emptyhash: string

  constructor(args: AssstesOptions) {
    this.datadir = args.datadir ? args.datadir : 'files'
    this.dataurl = args.dataurl
    this.webservertype = args.webservertype

    this.savefile = args.savefile
    this.privateKey = args.privateKey
    if (this.webservertype === 'nginx') {
      if (!this.privateKey) throw new Error('No private key for assets')
    }

    if (
      this.webservertype === 'openstackswift' ||
      this.savefile === 'openstackswift'
    ) {
      // TODO check if credentials are passed

      this.swiftaccount = args.swift?.account
      this.swiftcontainer = args.swift?.container
      this.swiftkey = args.swift?.key
      this.swiftbaseurl = args.swift?.baseurl
      this.swiftauthbaseurl = args.swift?.authbaseurl
      if (
        !this.swiftaccount ||
        !this.swiftcontainer ||
        !this.swiftkey ||
        !this.swiftbaseurl
      ) {
        throw new Error('Swift credentials incomplete!')
      }
      if (this.savefile === 'openstackswift') {
        this.swiftusername = args.swift?.username
        this.swiftpassword = args.swift?.password
        this.swiftdomain = args.swift?.domain
        this.swiftproject = args.swift?.project
        if (
          !this.swiftusername ||
          !this.swiftpassword ||
          !this.swiftdomain ||
          !this.swiftproject ||
          !this.swiftauthbaseurl
        )
          throw new Error('Swift save credentials incomplete!')
      }
    }
    if (this.webservertype === 's3' || this.savefile === 's3') {
      this.s3AK = args.s3?.AK
      this.s3SK = args.s3?.SK
      this.s3region = args.s3?.region
      this.s3bucket = args.s3?.bucket
      this.s3host = args.s3?.host
      this.s3alturl = args.s3?.alturl
      if (
        !this.s3AK ||
        !this.s3SK ||
        !this.s3region ||
        !this.s3bucket ||
        !this.s3host
      )
        throw new Error('S3 parameters missing')
    }

    this.shatofilenameLocal = this.shatofilenameLocal.bind(this)
    this.getFileURL = this.getFileURL.bind(this)
    this.saveFile = this.saveFile.bind(this)
    this.saveFileStream = this.saveFileStream.bind(this)
    this.handleFileUpload = this.handleFileUpload.bind(this)
    this.shadelete = this.shadelete.bind(this)
    this.setupAssets = this.setupAssets.bind(this)

    this.emptyhash = createHash('sha256').update('').digest('hex')
    this.xmlparser = new XMLParser()
  }

  async setupAssets() {
    console.log('setting up assets')
    if (this.savefile === 'openstackswift') {
      console.log('configuring open stack headers')
      // first get auth token
      const authtoken = await this.openstackToken()

      let response
      try {
        const path = '/v1/' + this.swiftaccount + '/' + this.swiftcontainer
        response = await axios.post(
          this.swiftbaseurl + path,
          {},
          {
            headers: {
              'X-Auth-Token': authtoken,
              'X-Container-Meta-Temp-URL-Key': this.swiftkey,
              'X-Container-Meta-Access-Control-Allow-Origin': '*'
            }
          }
        )
        if (response?.status !== 204) {
          console.log('axios response', response)
          throw new Error('setup assests for openstack failed')
        }
      } catch (error) {
        console.log('axios response', response)
        console.log('problem axios setup', error)
        throw new Error('setup assests for openstack failed')
      }
    }
  }

  async getAssetList() {
    if (this.savefile === 's3') {
      let marker
      const fslist = []
      while (true) {
        const host = this.s3bucket + '.' + this.s3host
        const uri = '/'
        let path = 'https://' + host + uri
        const date = new Date()
        const headers: S3Headers = {
          Date: date.toUTCString(),
          Host: host,
          'x-amz-content-sha256': this.emptyhash
        }
        let response
        let query = ''
        if (marker) {
          query = 'marker=' + marker
          path += '?' + query
        }
        try {
          headers.Authorization = this.s3AuthHeader({
            headers,
            uri,
            verb: 'GET',
            query,
            hashedpayload: this.emptyhash,
            date
          })
          response = await axios.get(path, {
            headers: headers as Record<string, any>
          })
          if (response?.status !== 200) {
            console.log('axios response', response)
            if (response?.status === 404) break
            throw new Error('get list failed')
          }
          if (response.data) {
            const contents = this.xmlparser.parse(response.data)
              ?.ListBucketResult?.Contents
            if (contents) {
              fslist.push(
                ...contents.map((el: { Key: any; Size: any }) => ({
                  id: el.Key,
                  size: el.Size
                }))
              )
              marker = contents[contents.length - 1].Key
            } else break
          } else break // no further data
        } catch (error) {
          console.log('axios response', response)
          console.log('problem axios get', error)
          throw error
        }
      }
      return fslist
    } else if (this.savefile === 'openstackswift') {
      let marker
      const fslist = []
      while (true) {
        let response
        try {
          const path: string =
            '/v1/' +
            this.swiftaccount +
            '/' +
            this.swiftcontainer +
            (marker ? '?marker=' + marker : '')
          response = await axios.get(this.swiftbaseurl + path, {
            headers: { 'X-Auth-Token': await this.openstackToken() }
          })
          if (response?.status !== 200) {
            console.log('axios response', response)
            if (response?.status === 404) break
            throw new Error('get list failed')
          }
          if (response.data?.length) {
            fslist.push(
              ...response.data.map(
                (el: { name: any; bytes: any; content_type: any }) => ({
                  id: el.name,
                  size: el.bytes,
                  mime: el.content_type
                })
              )
            )
            marker = response.data[response.data.length - 1].name
          } else break // no further data
        } catch (error) {
          console.log('axios response', response)
          console.log('problem axios get', error)
          throw error
        }
      }
      return fslist
    } else if (this.savefile === 'fs') {
      console.log('datadir', this.datadir)
      const startsearch = this.datadir + '/'
      const fslist: { id: string; size: number; mime: string | undefined }[] =
        []
      const searchdir = async (path: PathLike) => {
        const dirfiles = await readdir(path)
        for await (const file of dirfiles) {
          const curstat = await stat(path + file)
          if (curstat.isFile()) {
            const finfo = file.split('.')
            fslist.push({
              id: finfo[0],
              size: curstat.size,
              mime:
                finfo.length > 1 ? this.extensionToMime(finfo[1]) : undefined
            })
          } else if (curstat.isDirectory()) {
            await searchdir(path + file + '/')
          }
        }
      }
      await searchdir(startsearch)
      return fslist
    } else throw new Error('undefined or unknown save type')
  }

  // now we skip URIencode and restrict names thus to number and normal letter,
  // which is sufficient for our application
  s3CalculateSignature({
    iso8601date,
    sdate,
    verb,
    headers,
    signedheaders,
    uri,
    query = '',
    scope,
    hashedpayload
  }: {
    iso8601date: string
    sdate: string
    verb: string
    headers: Record<string, string>
    signedheaders: string
    uri: string
    query?: string
    scope: string
    hashedpayload: string
  }) {
    if (!this.s3region) throw new Error('S3 Region not set')
    const cheaders = Object.entries(headers)
      .map(([key, value]) => key.toLowerCase() + ':' + value.trim() + '\n')
      .join('')

    const canonicalRequest =
      verb +
      '\n' +
      uri +
      '\n' +
      query +
      '\n' +
      cheaders +
      '\n' +
      signedheaders +
      '\n' +
      hashedpayload
    const stringToSign =
      'AWS4-HMAC-SHA256' +
      '\n' +
      iso8601date +
      '\n' +
      scope +
      '\n' +
      createHash('sha256').update(canonicalRequest).digest('hex')
    // console.log('Canonical Request:\n', canonicalRequest)
    // console.log('stringToSign:\n', stringToSign)

    const DateKey = createHmac('sha256', 'AWS4' + this.s3SK)
      .update(sdate, 'utf8')
      .digest()

    const DateRegionKey = createHmac('sha256', DateKey)
      .update(this.s3region, 'utf8')
      .digest()
    const DateRegionServiceKey = createHmac('sha256', DateRegionKey)
      .update('s3', 'utf8')
      .digest()
    const SigningKey = createHmac('sha256', DateRegionServiceKey)
      .update('aws4_request', 'utf8')
      .digest()

    return createHmac('sha256', SigningKey)
      .update(stringToSign, 'utf8')
      .digest('hex')
  }

  s3Dates(date: Date | undefined) {
    const wdate = date || new Date()
    const twodigits = (inp: number) => ('0' + inp).slice(-2)
    const sdate =
      wdate.getUTCFullYear() +
      twodigits(wdate.getUTCMonth() + 1) +
      twodigits(wdate.getUTCDate())
    const iso8601date =
      sdate +
      'T' +
      twodigits(wdate.getUTCHours()) +
      twodigits(wdate.getUTCMinutes()) +
      twodigits(wdate.getUTCSeconds()) +
      'Z'

    return { sdate, iso8601date }
  }

  s3AuthHeader(args: {
    headers?: any
    uri: string
    verb: string
    query?: string
    hashedpayload: string
    date?: any
    iso8601date?: string
    sdate?: string
    signedheaders?: string
    scope?: string
  }) {
    const { headers } = args
    const signedheaders = Object.keys(headers)
      .map((el) => el.toLowerCase())
      .join(';')

    const { sdate, iso8601date } = this.s3Dates(args.date)

    const scope = sdate + '/' + this.s3region + '/s3/aws4_request'
    return (
      'AWS4-HMAC-SHA256' +
      ' Credential=' +
      this.s3AK +
      '/' +
      scope +
      ',' +
      'SignedHeaders=' +
      signedheaders +
      ',' +
      'Signature=' +
      this.s3CalculateSignature({
        sdate,
        iso8601date,
        headers,
        signedheaders,
        scope,
        ...args
      })
    )
  }

  // may be should go to security
  async openstackToken(): Promise<string> {
    let token = await this.ostoken
    if (!token || token.expire < Date.now() - 60 * 60 * 1000) {
      const {
        promise,
        resolve: myres,
        reject: myrej
      } = Promise.withResolvers<OpenstackToken>()

      this.ostoken = promise
      try {
        const ret = await axios.post(
          this.swiftauthbaseurl + '/v3/auth/tokens',
          {
            auth: {
              identity: {
                methods: ['password'],
                password: {
                  user: {
                    name: this.swiftusername,
                    password: this.swiftpassword,
                    domain: {
                      id: this.swiftdomain
                    }
                  }
                },
                scope: {
                  project: {
                    name: this.swiftproject,
                    domain: { id: this.swiftdomain }
                  }
                }
              }
            }
          },
          {
            headers: {
              'Content-Type': 'application/json;charset=utf8'
            }
          }
        )
        if (
          ret &&
          ret?.status === 201 &&
          ret?.data?.token?.expires_at &&
          ret?.headers?.['x-subject-token']
        ) {
          token = {
            token: ret.headers['x-subject-token'],
            tokeninfo: ret.data.token,
            expire: new Date(ret.data.token.expires_at).getTime()
          }
          myres(token)
        } else {
          console.log('axios response', ret)
          myrej(new Error('problem getting token'))
        }
      } catch (error) {
        myrej(error)
      }
    }
    if (typeof token === 'undefined')
      throw new Error('Internal problem in token retrieval')
    return token?.token
  }

  getFileURL(sha: { toString(p: 'hex'): string }, mimetype: string) {
    if (this.webservertype === 's3') {
      const host = this.s3bucket + '.' + this.s3host
      const shahex = sha.toString('hex')
      const uri = '/' + shahex
      const path = 'https://' + (this.s3alturl || host) + uri
      const headers = { Host: this.s3alturl || host }

      const expiresInSeconds = 60 * 60 * 24
      const signedheaders = Object.keys(headers)
        .map((el) => el.toLowerCase())
        .join(';')
      const { sdate, iso8601date } = this.s3Dates(undefined)
      const scope = sdate + '/' + this.s3region + '/s3/aws4_request'
      const scopeurl = sdate + '%2F' + this.s3region + '%2Fs3%2Faws4_request'
      const query =
        'X-Amz-Algorithm=AWS4-HMAC-SHA256' +
        '&X-Amz-Credential=' +
        this.s3AK +
        '%2F' +
        scopeurl +
        '&X-Amz-Date=' +
        iso8601date +
        '&X-Amz-Expires=' +
        expiresInSeconds +
        '&X-Amz-SignedHeaders=' +
        signedheaders

      const signature = this.s3CalculateSignature({
        hashedpayload: 'UNSIGNED-PAYLOAD',
        sdate,
        iso8601date,
        headers,
        signedheaders,
        scope,
        query,
        uri,
        verb: 'GET'
      })
      return path + '?' + query + '&X-Amz-Signature=' + signature
    } else if (this.webservertype === 'nginx') {
      const url = '/' + this.shatofilenameLocal(sha, mimetype)
      const expires = new Date().getTime() + 1000 * 60 * 60 * 24
      const input = expires + url + ' ' + this.privateKey
      const binaryHash = createHash('md5').update(input).digest()
      const base64Value = Buffer.from(binaryHash).toString('base64')
      const mdhash = base64Value
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

      let mydataurl = this.dataurl
      if (mydataurl === '/') mydataurl = ''

      return mydataurl + url + '?md5=' + mdhash + '&expires=' + expires
    } else if (this.webservertype === 'openstackswift') {
      const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24
      const shahex = sha.toString('hex')
      if (
        typeof this.swiftaccount === 'undefined' ||
        typeof this.swiftcontainer === 'undefined' ||
        typeof this.swiftkey === 'undefined'
      )
        throw new Error('Swift credentials not set')
      const path =
        '/v1/' + this.swiftaccount + '/' + this.swiftcontainer + '/' + shahex
      const key = this.swiftkey
      const hmacBody = 'GET\n' + expires + '\n' + path
      const signature = createHmac('sha256', key)
        .update(hmacBody, 'utf8')
        .digest('hex')

      return (
        this.swiftbaseurl +
        path +
        '?temp_url_sig=' +
        signature +
        '&temp_url_expires=' +
        expires +
        '&filename=' +
        shahex.substr(0, 16) +
        this.mimeToExtension(mimetype)
      )
    } else
      throw new Error('unsupported webservertype assets:' + this.webservertype)
  }

  shatofilenameLocal(sha: { toString: (arg0: 'hex') => string }, mime: string) {
    const shahex = sha.toString('hex')
    const dir =
      this.datadir + '/' + shahex.substr(0, 2) + '/' + shahex.substr(2, 4)
    return dir + '/' + shahex + this.mimeToExtension(mime)
  }

  async tempmkdirLocal() {
    await mkdir(this.datadir + '/temp', { recursive: true })
  }

  tempFileLocal() {
    const dir = this.datadir + '/temp/upload-' + randomUUID() + '.tmp'
    return dir
  }

  async shadelete(shahex: string, ext: string) {
    if (this.savefile === 'fs') {
      const dir =
        this.datadir + '/' + shahex.substr(0, 2) + '/' + shahex.substr(2, 4)
      await rm(dir + '/' + shahex + '.' + ext)
    } else if (this.savefile === 's3') {
      const host = this.s3bucket + '.' + this.s3host
      const uri = '/' + shahex
      const path = 'https://' + host + uri
      const date = new Date()
      const headers: S3Headers = {
        Date: date.toUTCString(),
        Host: host,
        'x-amz-content-sha256': this.emptyhash
      }
      let response
      try {
        headers.Authorization = this.s3AuthHeader({
          headers,
          uri,
          verb: 'DELETE',
          date,
          hashedpayload: this.emptyhash
        })
        response = await axios.delete(path, {
          headers: headers as Record<string, any>
        })
        if (response?.status !== 204) {
          console.log('axios response', response)
          throw new Error('delete failed for' + shahex)
        }
      } catch (error) {
        console.log('axios response', response)
        console.log('problem axios delete', error)
        throw error
      }
    } else if (this.savefile === 'openstackswift') {
      let response
      try {
        const path =
          '/v1/' + this.swiftaccount + '/' + this.swiftcontainer + '/' + shahex
        response = await axios.delete(this.swiftbaseurl + path, {
          headers: { 'X-Auth-Token': await this.openstackToken() }
        })
        if (response?.status !== 204) {
          console.log('axios response', response)
          throw new Error('delete failed for' + shahex)
        }
      } catch (error) {
        console.log('axios response', response)
        console.log('problem axios delete', error)
        throw error
      }
    } else {
      throw new Error('unimplemented delete assets:' + this.savefile)
    }
  }

  async shamkdirLocal(sha: { toString: (arg0: 'hex') => string }) {
    const shahex = sha.toString('hex')
    const dir =
      this.datadir + '/' + shahex.substr(0, 2) + '/' + shahex.substr(2, 4)
    await mkdir(dir, { recursive: true })
  }

  async readFileStream(
    sha: { toString: (arg0: string) => any },
    mime: string | ((p: string) => void)
  ) {
    if (this.savefile === 'fs') {
      if (typeof mime !== 'string')
        throw new Error('Passed mime callback in fs case')
      const filename = this.shatofilenameLocal(sha, mime)
      const fd = await open(filename)
      const stream = fd.createReadStream()
      return stream
    } else if (this.savefile === 's3') {
      if (typeof mime === 'string')
        throw new Error('Passed mime string in S3 case')
      const host = this.s3bucket + '.' + this.s3host
      const shahex = sha.toString('hex')
      const uri = '/' + shahex
      const path = 'https://' + host + uri
      const date = new Date()
      const headers: S3Headers = {
        Date: date.toUTCString(),
        Host: host,
        'x-amz-content-sha256': this.emptyhash
      }
      let response
      try {
        headers.Authorization = this.s3AuthHeader({
          headers,
          uri,
          verb: 'GET',
          date,
          hashedpayload: this.emptyhash
        })
        response = await axios.get(path, {
          headers: headers as Record<string, any>,
          responseType: 'stream'
        })
        if (response?.status !== 200) {
          console.log('axios response', response)
          throw new Error('read failed for' + shahex)
        }
        // in the S3 case, mime is a callback
        if (response?.headers?.['content-type']) {
          mime(response?.headers?.['content-type'])
        } else throw new Error('no mime type from s3')
      } catch (error) {
        console.log('axios response', response)
        console.log('problem axios get', error)
        throw error
      }
      return response?.data
    } else if (this.savefile === 'openstackswift') {
      if (typeof mime !== 'string')
        throw new Error('Passed mime callback in openstack case')
      let response
      try {
        const shahex = sha.toString('hex')
        const path =
          '/v1/' + this.swiftaccount + '/' + this.swiftcontainer + '/' + shahex
        const config: {
          headers: Record<string, any>
          responseType: ResponseType
        } = {
          headers: {
            'X-Auth-Token': await this.openstackToken(),
            'Content-Type': mime
          },
          responseType: 'stream'
        }
        response = await axios.get(this.swiftbaseurl + path, config)
        if (response?.status !== 200) {
          console.log('axios response', response)
          throw new Error('read failed for' + shahex)
        }
      } catch (error) {
        console.log('axios response', response)
        console.log('problem axios get', error)
        throw error
      }
      return response?.data
    }
  }

  async saveFile(
    input: Buffer | Uint8Array,
    sha: Buffer<ArrayBuffer>,
    mime: string,
    size: any
  ) {
    // size is optional
    if (this.savefile === 'fs') {
      await this.shamkdirLocal(sha)
      const filename = this.shatofilenameLocal(sha, mime)

      await writeFile(filename, input)
    } else if (this.savefile === 's3') {
      const host = this.s3bucket + '.' + this.s3host
      const shahex = sha.toString('hex')
      const uri = '/' + shahex
      const path = 'https://' + host + uri
      const date = new Date()
      const length = input?.length || size
      let headers: S3Headers & {
        'Content-Length': string
        'Content-Type': string
        'Content-Disposition'?: string
      } = {
        'Content-Length': String(length),
        'Content-Type': mime,
        Date: date.toUTCString(),
        Host: host,
        'x-amz-content-sha256': shahex
      }
      const contentDisposition = this.mimeToContentDisposition(mime)
      if (contentDisposition) {
        headers = { 'Content-Disposition': contentDisposition, ...headers }
      }
      let response
      try {
        headers.Authorization = this.s3AuthHeader({
          headers,
          uri,
          verb: 'PUT',
          date,
          hashedpayload: shahex
        })
        response = await axios.put(path, input, {
          headers: headers as Record<string, any>
        })
        if (response?.status !== 200) {
          console.log('axios response', response)
          throw new Error('save failed for' + shahex)
        }
      } catch (error) {
        console.log('axios response', response)
        console.log('problem axios save', error)
        throw error
      }
    } else if (this.savefile === 'openstackswift') {
      let response
      try {
        const shahex = sha.toString('hex')
        const path =
          '/v1/' + this.swiftaccount + '/' + this.swiftcontainer + '/' + shahex
        const config: {
          headers: {
            'X-Auth-Token': string
            'Content-Type': string
            'Content-Disposition'?: string
          }
        } = {
          headers: {
            'X-Auth-Token': await this.openstackToken(),
            'Content-Type': mime
          }
        }
        const contentDisposition = this.mimeToContentDisposition(mime)
        if (contentDisposition)
          config.headers['Content-Disposition'] = contentDisposition
        response = await axios.put(this.swiftbaseurl + path, input, config)
        if (response?.status !== 201) {
          console.log('axios response', response)
          throw new Error('save failed for' + shahex)
        }
      } catch (error) {
        console.log('axios response', response)
        console.log('problem axios save', error)
        throw error
      }
    } else throw new Error('unsupported savefile method ' + this.savefile)
  }

  async saveFileStream(inputStream: Readable, mime: string, size: number) {
    const filehash = createHash('sha256')

    const digest = Promise.withResolvers<Buffer>()
    let lengthCount = 0
    const hashstream = new Transform({
      transform(data, encoding, callback) {
        filehash.update(data)
        lengthCount += data.length
        if (lengthCount > size) {
          callback(
            new Error(
              'Specified length is exceeded in incoming request exceeding:' +
                size
            )
          )
        } else {
          callback(null, data)
        }
      },
      flush(callback) {
        digest.resolve(filehash.digest())
        callback()
      }
    })

    const outputstream = inputStream.pipe(hashstream)

    // size is optional
    if (this.savefile === 'fs') {
      await this.tempmkdirLocal()
      const tempFileName = this.tempFileLocal()
      const fh = await open(tempFileName, 'w')
      const writeStream = fh.createWriteStream()

      outputstream.pipe(writeStream)
      await finished(writeStream)
      writeStream.end()
      await fh.close()

      const sha = await digest.promise
      await this.shamkdirLocal(sha)
      const filename = this.shatofilenameLocal(sha, mime)
      await rename(tempFileName, filename)
    } else if (this.savefile === 's3') {
      const host = this.s3bucket + '.' + this.s3host
      // first step upload file
      const uuid = randomUUID()
      const tempUri = '/temp-' + uuid
      const tempPath = 'https://' + host + tempUri
      let response
      try {
        const date = new Date()
        const length = size
        const unsignedHash = 'UNSIGNED-PAYLOAD'
        let headers: S3Headers & {
          'Content-Length': string
          'Content-Type': string
          'Content-Disposition'?: string
        } = {
          'Content-Length': String(length),
          'Content-Type': mime,
          Date: date.toUTCString(),
          Host: host,
          'x-amz-content-sha256': unsignedHash
        }
        const contentDisposition = this.mimeToContentDisposition(mime)
        if (contentDisposition) {
          headers = { 'Content-Disposition': contentDisposition, ...headers }
        }

        headers.Authorization = this.s3AuthHeader({
          headers,
          uri: tempUri,
          verb: 'PUT',
          date,
          hashedpayload: unsignedHash
        })
        response = await axios.put(tempPath, outputstream, {
          headers: headers as Record<string, any>
        })
        if (response?.status !== 200) {
          console.log('axios response', response)
          throw new Error('save failed for temp upload')
        }
      } catch (error) {
        console.log('axios response #1', response)
        console.log('problem axios save #1', error)
        throw error
      }
      response = undefined // clear the response
      const sha = await digest.promise
      // second step copy file
      const shahex = sha.toString('hex')
      const shaUri = '/' + shahex
      const shaPath = 'https://' + host + shaUri
      try {
        const date = new Date()
        const headers: S3Headers & {
          'Content-Type': string
          'x-amz-copy-source': string
        } = {
          /* 'Content-Length': String(length), */
          'Content-Type': mime,
          Date: date.toUTCString(),
          Host: host,
          'x-amz-content-sha256': this.emptyhash,
          'x-amz-copy-source': '/' + this.s3bucket + tempUri
        }
        headers.Authorization = this.s3AuthHeader({
          headers,
          uri: shaUri,
          verb: 'PUT',
          date,
          hashedpayload: this.emptyhash
        })

        response = await axios.put(shaPath, null, {
          headers: headers as Record<string, any>
        })
        if (response?.status !== 200) {
          console.log('axios response', response)
          throw new Error('save copy failed for' + shahex)
        }
      } catch (error) {
        console.log('axios response #2', response)
        console.log('problem axios save #2', error)
        throw error
      }
      response = undefined // clear the response
      // third step remove temp file
      try {
        const date = new Date()
        const headers: S3Headers = {
          Date: date.toUTCString(),
          Host: host,
          'x-amz-content-sha256': this.emptyhash
        }

        headers.Authorization = this.s3AuthHeader({
          headers,
          uri: tempUri,
          verb: 'DELETE',
          date,
          hashedpayload: this.emptyhash
        })
        response = await axios.delete(tempPath, {
          headers: headers as Record<string, any>
        })
        if (response?.status !== 204) {
          console.log('axios response', response)
          throw new Error('save failed for' + shahex)
        }
      } catch (error) {
        console.log('axios response #3', response)
        console.log('problem axios save #3', error)
        throw error
      }
    } else if (this.savefile === 'openstackswift') {
      let response
      // upload temp file
      const uuid = randomUUID()
      const tempPath =
        '/v1/' + this.swiftaccount + '/' + this.swiftcontainer + '/temp-' + uuid
      try {
        const config: {
          headers: {
            'X-Auth-Token': string
            'Content-Type': string
            'Content-Disposition'?: string
          }
        } = {
          headers: {
            'X-Auth-Token': await this.openstackToken(),
            'Content-Type': mime
          }
        }
        const contentDisposition = this.mimeToContentDisposition(mime)
        if (contentDisposition)
          config.headers['Content-Disposition'] = contentDisposition
        response = await axios.put(
          this.swiftbaseurl + tempPath,
          outputstream,
          config
        )
        if (response?.status !== 201) {
          console.log('axios response', response)
          throw new Error('save failed for temp upload ' + uuid)
        }
      } catch (error) {
        console.log('axios response to problem', response)
        console.log('problem axios save #1 ', error)
        throw error
      }
      const sha = await digest.promise

      const shahex = sha.toString('hex')
      // const shaPath =
      //  '/v1/' + this.swiftaccount + '/' + this.swiftcontainer + '/' + shahex

      // copy temp file to final file
      try {
        const config = {
          headers: {
            'X-Auth-Token': await this.openstackToken(),
            Destination: this.swiftcontainer + '/' + shahex,
            'Content-Type': mime
          },
          method: 'COPY',
          url: this.swiftbaseurl + tempPath
        }
        response = await axios(config)
        if (response?.status !== 201) {
          console.log('axios response to problem', response)
          throw new Error('copy failed for' + shahex)
        }
      } catch (error) {
        console.log('axios response to problem', response)
        console.log('problem axios save #2', error)
        throw error
      }

      // delete temp file
      try {
        const config = {
          headers: {
            'X-Auth-Token': await this.openstackToken()
          }
        }
        response = await axios.delete(this.swiftbaseurl + tempPath, config)
        if (response?.status !== 204) {
          console.log('axios response', response)
          throw new Error('save failed for' + shahex + 'at delete operation')
        }
      } catch (error) {
        console.log('axios response', response)
        console.log('problem axios save #3', error)
        throw error
      }
    } else throw new Error('unsupported savefile method ' + this.savefile)
    return { sha256: await digest.promise }
  }

  async handleFileUpload(
    req: Request,
    body: Partial<Record<string, string>>,
    requiredFields: { [x: string]: string },
    forbiddenFields: { [x: string]: string },
    filesToUpload: string[],
    maxFileSize: number,
    supportedMime: string[]
  ) {
    const filesResolve: Record<
      string,
      (value: BusBoyFile | undefined) => void
    > = {}
    const filesReject: Partial<Record<string, (reason: any) => void>> = {}
    const files: Partial<Record<string, Promise<BusBoyFile | undefined>>> = {}
    const filesSizes: Partial<Record<string, number>> = {}
    let forbiddenField: string | undefined
    for (const file of filesToUpload) {
      const field = file
      const { promise, resolve, reject } = Promise.withResolvers<
        BusBoyFile | undefined
      >()
      files[field] = promise
      filesResolve[field] = resolve
      filesReject[field] = reject
    }
    const contentType = req.headers['content-type']
    if (!contentType) throw new Error('Content type not set')

    const bus = new Busboy({
      headers: { ...req.headers, 'content-type': contentType }
    })
    bus.on(
      'file',
      (
        fieldname: string,
        stream: Readable,
        filename: string,
        transferEncoding: string,
        mimeType: string
      ) => {
        if (!files[fieldname]) return // only download requested files
        if (forbiddenField) {
          delete filesResolve[fieldname]
          delete files[fieldname]
          filesReject[fieldname]?.(
            new Error('Forbidden field transmitted before file')
          )
          return // we are not allowed to proceed if a forbidden field arrives
        }
        if (Object.keys(requiredFields).length !== 0) {
          delete filesResolve[fieldname]
          delete files[fieldname]
          filesReject[fieldname]?.(
            new Error('Required fields not transmitted before file')
          )
          return // we must receive the required fields beforehand!
        }
        if (!filesSizes[fieldname]) {
          delete filesResolve[fieldname]
          delete files[fieldname]
          filesReject[fieldname]?.(new Error('File length not transmitted'))
          return // we must receive the fileSize beforehand!
        }
        const fileobj = {
          filename,
          stream,
          fieldname,
          transferEncoding,
          mimeType,
          size: filesSizes[fieldname]
        }
        filesResolve[fieldname](fileobj)
        delete filesReject[fieldname]
      }
    )

    bus.on(
      'field',
      (
        fieldname: string | null,
        value: string,
        fieldnameTruncated: boolean,
        valueTruncated,
        transferEncoding: string,
        mimeType: string
      ) => {
        if (fieldname == null) return
        if (fieldnameTruncated || valueTruncated) return
        if (fieldname.startsWith('SIZE_')) {
          const fileKey = fieldname.substring(5)
          const size = (filesSizes[fileKey] = Number(value))
          if (size > maxFileSize && files[fileKey]) {
            delete filesResolve[fileKey]
            delete files[fileKey]
            filesReject[fileKey]?.(new Error('File length exceeded'))
          }
          return
        }
        if (requiredFields[fieldname]) {
          delete requiredFields[fieldname]
        }
        if (forbiddenFields[fieldname]) {
          forbiddenField = fieldname // we encountered a forbidden field
        }
        body[fieldname] = value
      }
    )

    bus.on('finish', () => {
      if (!forbiddenField) {
        // we need to reject the required files
        for (const [key, value] of Object.entries(filesReject)) {
          value?.(new Error('File with key ' + key + ' not transmitted'))
        }
      } else {
        // if we encounter a field forbidden in file download, we do not reject.
        for (const [, value] of Object.entries(filesResolve)) {
          value(undefined)
        }
      }
    })
    req.pipe(bus)
    return await Promise.all(
      Object.values(files).map(async (file) => {
        const curfile = await file
        if (!curfile) return undefined // no file obtained
        if (!supportedMime.includes(curfile.mimeType))
          throw new Error('unsupported mimetype ' + curfile.mimeType)
        const { sha256 } = await this.saveFileStream(
          curfile.stream,
          curfile.mimeType,
          curfile.size
        )
        return { sha256, mimeType: curfile.mimeType, size: curfile.size }
      })
    )
  }

  mimeToExtension(mime: string) {
    switch (mime) {
      case 'application/pdf':
        return '.pdf'
      case 'image/jpeg':
        return '.jpg'
      case 'image/png':
        return '.png'
      case 'image/gif':
        return '.gif'
      case 'application/x-ipynb+json':
        return '.ipynb'
      default:
        return ''
    }
  }

  mimeToExtensionwoDot(mime: string) {
    switch (mime) {
      case 'application/pdf':
        return 'pdf'
      case 'image/jpeg':
        return 'jpg'
      case 'image/png':
        return 'png'
      case 'image/gif':
        return 'gif'
      case 'application/x-ipynb+json':
        return 'ipynb'
      default:
        return ''
    }
  }

  extensionToMime(ext: string) {
    switch (ext) {
      case 'pdf':
        return 'application/pdf'
      case 'jpg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'ipynb':
        return 'application/x-ipynb+json'
      default:
        return ''
    }
  }

  mimeToContentDisposition(mime: string) {
    switch (mime) {
      case 'application/pdf':
        return undefined
      case 'image/jpeg':
        return undefined
      case 'image/png':
        return undefined
      case 'image/gif':
        return undefined
      case 'application/x-ipynb+json':
        return 'attachment; filename="notebook.ipynb"'
      default:
        return ''
    }
  }
}
