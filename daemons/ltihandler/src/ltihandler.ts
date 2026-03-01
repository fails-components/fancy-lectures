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

import { v4 as uuidv4, validate } from 'uuid'
import { type RedisClusterType, type RedisClientType } from 'redis'
import jwt from 'jsonwebtoken'
import { expressjwt as jwtexpress } from 'express-jwt'
import ky from 'ky'
import Jwk from 'rasha'
import moment from 'moment'
import type { Db as MongoDb } from 'mongodb'
import type { FailsJWTSigner } from '@fails-components/security'
import type { Request, Response } from 'express'
import type { Lecture } from '@fails-components/commonhandler'

type FailsLtiJwt = jwt.Jwt & {
  payload: {
    kid?: string
    iss?: string
  }
}

type FailsUser = {
  lms?: { username: string; sub: string }
  email?: string
  firstnames?: string
  lastname?: string
  displayname?: string
  lastlogin: Date
  uuid: string
}

export interface AuthenticatedLtiRequest extends Request {
  token?: { iss?: string }
}

type LtiKey = Jwk.Jwk & {
  kid: string
}

export class LtiHandler {
  protected mongo: MongoDb
  protected redis: RedisClusterType | RedisClientType
  protected signJwt: FailsJWTSigner['signToken']
  protected basefailsurl: Record<'stable' | 'experimental', string>
  protected onlyLearners: boolean
  protected addAdminList: string[]
  protected lmslist: Record<
    string,
    {
      keyset_url: string
      access_token_url: string
      auth_request_url: string
    }
  >
  protected coursewhitelist?: string[]

  constructor(args: {
    lmslist: Record<
      string,
      {
        keyset_url: string
        access_token_url: string
        auth_request_url: string
      }
    >
    signJwt: FailsJWTSigner['signToken']
    redis: RedisClusterType | RedisClientType
    mongo: MongoDb
    basefailsurl: Record<'stable' | 'experimental', string>
    coursewhitelist?: string[]
    onlyLearners: boolean
    addAdminList: string[]
  }) {
    this.lmslist = args.lmslist
    this.redis = args.redis
    this.mongo = args.mongo
    this.signJwt = args.signJwt
    this.basefailsurl = args.basefailsurl
    this.coursewhitelist = args.coursewhitelist
    this.onlyLearners = args.onlyLearners
    this.addAdminList = args.addAdminList

    console.log('ltihandler available lms ', args.lmslist)
    if (this.onlyLearners)
      console.log('all access limited to learner level for instructors')
  }

  handleLogin(req: Request, res: Response) {
    // console.log("Request:", req);
    // console.log("Res:",res);
    const params = { ...req.body }
    if (!params.iss || !params.login_hint || !params.target_link_uri)
      return res.status(400).send({
        status: 400,
        error: 'Bad Request',
        details: { message: 'no login parameters' }
      })

    console.log(
      'login request from',
      params.iss,
      'with client id',
      params.client_id
    ) // may be remove later
    const platform = this.lmslist[params.iss]
    if (!platform)
      return res.status(400).send({
        status: 400,
        error: 'Platform ' + params.iss + ' not registered!'
      })
    // use client_id for getting data base connection
    // if not active platform redirect

    const query = {
      // eslint-disable-next-line camelcase
      response_type: 'id_token',
      // eslint-disable-next-line camelcase
      response_mode: 'form_post',
      // eslint-disable-next-line camelcase
      id_token_signed_response_alg: 'RS256',
      scope: 'openid',
      // eslint-disable-next-line camelcase
      client_id: params.client_id,
      // eslint-disable-next-line camelcase
      redirect_uri: params.target_link_uri,
      // eslint-disable-next-line camelcase
      login_hint: params.login_hint,
      nonce: uuidv4(),
      prompt: 'none'
      /// state: "blabla"  // ok we do not need this, since nothing is bound to an account in this system
      // the lti is our authentification system, and identifies the user, so there is no access to our system
      // on which we have to keep track
      // it would be something else, if we require the user to login to our system first...
    }
    const url = new URL(platform.auth_request_url)
    url.search = new URLSearchParams({
      ...query,
      ...(params.lti_message_hint && {
        // eslint-disable-next-line camelcase
        lti_message_hint: params.lti_message_hint
      }),
      ...(params.lti_deployment_id && {
        // eslint-disable-next-line camelcase
        lti_deployment_id: params.lti_deployment_id
      })
    }).toString()
    res.redirect(url.toString())
  }

  async handleLaunch(req: Request, res: Response) {
    // console.log("Request:", req);
    // console.log("Res:",res);
    if (req.body.error) {
      return res.send('LMS reported error: ' + req.body.error_description)
    }
    if (req.body.id_token) {
      const decodedToken = jwt.decode(req.body.id_token, { complete: true })

      if (!decodedToken || typeof decodedToken.payload === 'string')
        return res.status(400).send({
          status: 400,
          error: 'Bad Request',
          details: {
            message: 'no token or string payload' + ' not registered/supported'
          }
        })

      if (typeof decodedToken.payload.iss !== 'string')
        return res.status(400).send({
          status: 400,
          error: 'Bad Request',
          details: {
            message: 'payload.iss is not a string'
          }
        })
      const platform = this.lmslist[decodedToken.payload.iss]

      if (!platform)
        return res.status(400).send({
          status: 400,
          error: 'Bad Request',
          details: {
            message:
              'platform' +
              decodedToken.payload.iss +
              ' not registered/supported'
          }
        })
      interface JwksResponse {
        keys: ({ kid: string } & Jwk.Jwk)[]
      }
      let keyinfo: JwksResponse | undefined
      try {
        keyinfo = await ky.get(platform.keyset_url).json()
        if (!keyinfo || typeof keyinfo.keys !== 'object')
          throw new Error('wrong Keyinfo type')
      } catch (error) {
        console.log('lti error, key fetch', error)
        return res
          .status(400)
          .send({ status: 400, error: 'problem, while accessing platform key' })
      }

      const keys = keyinfo.keys
      if (!keys)
        return res.status(400).send({ status: 400, error: 'Keyset not found' })

      if (!decodedToken.header.kid)
        return res.status(400).send({ status: 400, error: 'no valid kid!' })

      const jwk = keys.find((key) => {
        return key.kid === decodedToken.header.kid
      })
      if (!jwk)
        return res.status(400).send({ status: 400, error: 'key not found' })
      let key
      try {
        key = await Jwk.export({
          jwk: jwk,
          format: 'pkcs1',
          public: true
        })
      } catch (error) {
        console.log('Jwk export: error', error)
        return res
          .status(500)
          .send({ status: 400, error: 'key export problem' })
      }
      const payload = decodedToken.payload

      // console.log("decoded token payload",payload);
      if (!validate(payload.nonce))
        return res
          .status(400)
          .send({ status: 400, error: 'nonce wrong format' })
      let redres
      try {
        redres = await this.redis.exists('lti:nonce:' + payload.nonce)
      } catch (error) {
        console.log('lti error, redis', error)
        return res.status(400).send({ status: 400, error: 'redis broken' })
      }
      if (redres === 1)
        return res
          .status(400)
          .send({ status: 400, error: 'nonce reused, replay attack?' })
      else {
        // we have to store it in the db
        try {
          await this.redis.set('lti:nonce:' + payload.nonce, 'dummy', {
            EX: 60 * 10 /* 10 minutes */
          }) // we do not have to use the callback
        } catch (error) {
          console.log('lti error, redis', error)
          return res.status(400).send({ status: 400, error: 'redis broken' })
        }

        try {
          if (
            !jwt.verify(req.body.id_token, key, {
              /* nonce: ADD */
            })
          )
            return res
              .status(400)
              .send({ status: 400, error: 'jwt verification failure' })
        } catch (error) {
          return res.status(400).send({
            status: 400,
            error: 'jwt verification failure with error:' + error
          })
        }

        if (
          payload['https://purl.imsglobal.org/spec/lti/claim/message_type'] !==
          'LtiResourceLinkRequest'
        )
          return res.status(400).send({
            status: 400,
            error:
              'so far only resource links are supported ' +
              payload['https://purl.imsglobal.org/spec/lti/claim/message_type']
          })

        // now we have to collect the data
        const userinfo = {
          ...{
            firstnames: payload.given_name,
            lastname: payload.family_name,
            displayname: payload.name,
            email: payload.email, // can be used for matching persons, multple possible
            lmssub: payload.sub // even this may be missing in anonymus case
          },
          ...(payload['https://purl.imsglobal.org/spec/lti/claim/ext'] && {
            lmsusername:
              payload['https://purl.imsglobal.org/spec/lti/claim/ext']
                .user_username
          })
        }

        // console.log("userinfo", userinfo);
        const lmscontext = {
          // TODO add unique platform identifier?
          // eslint-disable-next-line camelcase
          ret_url:
            payload[
              'https://purl.imsglobal.org/spec/lti/claim/launch_presentation'
            ].return_url,
          iss: payload.iss, // not optional, use for identification

          /* aud: payload.aud, */ // may be exclude
          // eslint-disable-next-line camelcase
          platform_id:
            payload['https://purl.imsglobal.org/spec/lti/claim/tool_platform']
              .guid, // optional
          // eslint-disable-next-line camelcase
          deploy_id:
            payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'], // do not use for identification, period!
          // eslint-disable-next-line camelcase
          course_id:
            payload['https://purl.imsglobal.org/spec/lti/claim/context'].id, // optional, use for context identification if possible
          // eslint-disable-next-line camelcase
          resource_id:
            payload['https://purl.imsglobal.org/spec/lti/claim/resource_link']
              .id // use for identification
        }
        if (
          this.coursewhitelist &&
          (!lmscontext.course_id ||
            this.coursewhitelist.indexOf(lmscontext.course_id) === -1)
        ) {
          return res.status(400).send({
            status: 400,
            error: 'course ' + lmscontext.course_id + ' not on whitelist'
          })
        }

        if (!lmscontext.deploy_id || !lmscontext.resource_id || !lmscontext.iss)
          return res
            .status(400)
            .send({ status: 400, error: 'lti mandatory fields missing' })
        // console.log("lmscontext", lmscontext);
        const lectureinfo = {
          coursetitle:
            payload['https://purl.imsglobal.org/spec/lti/claim/context']
              .title ||
            payload['https://purl.imsglobal.org/spec/lti/claim/context']
              .label ||
            payload['https://purl.imsglobal.org/spec/lti/claim/resource_link']
              .title,
          lecturetitle:
            payload['https://purl.imsglobal.org/spec/lti/claim/resource_link']
              .title
        }
        // console.log("lectureinfo", lectureinfo);

        const rolesKey = 'https://purl.imsglobal.org/spec/lti/claim/roles'
        const role = []
        if (
          payload[rolesKey].includes(
            'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'
          )
        )
          role.push('audience')

        if (
          payload[rolesKey].includes(
            'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator'
          ) ||
          payload[rolesKey].includes(
            'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator'
          )
        ) {
          role.push('administrator')
        }

        if (
          payload[rolesKey].includes(
            'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'
          )
        ) {
          if (payload.sub && !this.onlyLearners) {
            role.push('instructor')
          } else role.push('audience') // only audience supported, if anonymous
        }
        // console.log(role);
        // ok we have everything, but now we have to bind it to fails structures
        // we to identify lecture and context, which can be course or the lecture
        // and the user !!
        const failsuser = await this.identifyCreateUser(userinfo)
        // console.log('failsuser', failsuser)
        const courseinfo = {
          ...{ lms: lmscontext, linfo: lectureinfo },
          ...(role.includes('instructor') &&
            !role.includes('administrator') &&
            failsuser && {
              owner: failsuser.useruuid, // claim ownership
              ownerdisplayname: failsuser.displayname
            })
        }
        // the next is done after displayname setting, as this case should not prevent changing displaynames
        if (
          !role.includes('administrator') &&
          userinfo.lmsusername &&
          this.addAdminList.includes(userinfo.lmsusername)
        ) {
          role.push('administrator')
        }

        const failscourse =
          await this.identifyCreateLectureAndCourse(courseinfo) // TODO
        if (!failscourse)
          return res
            .status(400)
            .send({ status: 400, error: 'resource can not be identified' })
        // console.log('failscourse', failscourse)

        const token = {
          course: { lectureuuid: failscourse.lectureuuid },
          user: failsuser,
          role: role,
          context: 'lti',
          appversion: failscourse.appversion,
          features: failscourse.features,
          maxrenew: 22
        } // 12 times 10 minutes should be enough
        const jwttoken = await this.signJwt(token)

        return res.redirect(
          this.basefailsurl[failscourse.appversion] + '/' + '?token=' + jwttoken
        )
      }

      // console.log("decoded token",decodedToken.payload);
    } else
      return res.status(400).send({
        status: 400,
        error: 'Bad Request',
        details: { message: 'no id_token' }
      })
  }

  async identifyCreateUser(userinfo: {
    lmsusername?: string
    lmssub?: string
    email?: string
    firstnames?: string
    lastname?: string
    displayname?: string
  }) {
    const userscol = this.mongo.collection<FailsUser>('users')

    const orquery = []
    if (userinfo.lmssub) orquery.push({ 'lms.sub': userinfo.lmssub })
    if (userinfo.lmsusername)
      orquery.push({ 'lms.username': userinfo.lmsusername })
    if (userinfo.email) orquery.push({ email: userinfo.email })

    if (orquery.length === 0) return // no user info get out

    const userdoc = await userscol.findOne({ $or: orquery })
    // console.log("user info from db", userdoc);
    let useruuid
    let firstnames = userinfo.firstnames
    let lastname = userinfo.lastname
    let displayname = userinfo.displayname
    let email = userinfo.email

    if (userdoc == null) {
      const lmssub = userinfo.lmssub
      const lmsusername = userinfo.lmsusername
      if (!displayname && firstnames && lastname)
        displayname = firstnames + lastname
      // deploy data
      const toinsert: FailsUser = {
        ...{
          lastlogin: new Date(),
          uuid: uuidv4()
        },
        ...(lmssub &&
          lmsusername && {
            lms: {
              sub: lmssub,
              username: lmsusername
            }
          }),
        ...(displayname && { displayname }),
        ...(firstnames && { firstnames }),
        ...(lastname && { lastname }),
        ...(email && { email })
      }

      await userscol.insertOne(toinsert)
    } else {
      // check if we want to update
      useruuid = userdoc.uuid
      if (!firstnames) firstnames = userdoc.firstnames
      if (!lastname) lastname = userdoc.lastname
      if (!displayname) displayname = userdoc.displayname
      if (!email) email = userdoc.email

      if (!displayname && firstnames && lastname)
        displayname = firstnames + lastname

      const toupdate: Partial<FailsUser> = {
        ...(userdoc.displayname !== displayname && { displayname }),
        ...(userdoc.firstnames !== userinfo.firstnames && {
          firstnames: userinfo.firstnames
        }),
        ...(userdoc.lastname !== userinfo.lastname && {
          lastname: userinfo.lastname
        }),
        ...(userdoc.email !== userinfo.email && { email: userinfo.email }),
        ...((userinfo.lmssub || userinfo.lmsusername) &&
          (!userdoc.lms ||
            userdoc.lms.sub !== userinfo.lmssub ||
            userdoc.lms.username !== userinfo.lmsusername) &&
          userinfo.lmssub &&
          userinfo.lmsusername && {
            lms: {
              ...userdoc.lms,
              ...{
                sub: userinfo.lmssub,
                username: userinfo.lmsusername
              }
            }
          })
      }
      if (Object.keys(toupdate).length > 0) {
        userscol.updateOne(
          { uuid: useruuid },
          { $set: toupdate, $currentDate: { lastlogin: true } }
        )
      } else {
        // console.log("no update",toupdate);
        if (
          !userdoc.lastlogin ||
          (userdoc.lastlogin &&
            moment(userdoc.lastlogin).isBefore(moment().subtract(3, 'days')))
        ) {
          // console.log('renew lastlogin')
          userscol.updateOne(
            { uuid: useruuid },
            { $currentDate: { lastlogin: true } }
          )
        }
      }
    }

    const retobj = {
      ...{ useruuid: useruuid },
      // if (firstnames) retobj.firstnames=firstnames;
      // if (lastname) retobj.lastname=lastname;
      ...(displayname && { displayname })
    }
    // if (email) retobj.email=email;
    return retobj
  }

  async identifyCreateLectureAndCourse(args: {
    lms: {
      iss?: string
      resource_id?: string
      course_id?: string
      platform_id?: string
      deploy_id?: string
    }
    linfo: {
      lecturetitle: string
      coursetitle: string
    }
    owner?: string
    ownerdisplayname?: string
  }) {
    const lms = args.lms
    const linfo = args.linfo

    const lecturescol = this.mongo.collection<Lecture>('lectures')

    const andquery = []

    if (!lms.iss || !lms.resource_id) {
      console.log('resource can not be identified! abort')
      return null
    }
    andquery.push({ 'lms.iss': lms.iss })
    andquery.push({ 'lms.resource_id': lms.resource_id })

    // TODO add course stuff
    // console.log("andquery", andquery);
    const lecturedoc = await lecturescol.findOne({ $and: andquery })
    // console.log('lecturedoc', lecturedoc)

    let lectureuuid = null

    let title = linfo.lecturetitle
    let coursetitle = linfo.coursetitle

    let appversion =
      lecturedoc?.appversion === 'stable' ||
      lecturedoc?.appversion === 'experimental'
        ? (lecturedoc.appversion as 'stable' | 'experimental')
        : 'stable'
    let features = lecturedoc?.features || []
    if ((lecturedoc == null || !lecturedoc.appversion) && lms.course_id) {
      const lectappdoc = await lecturescol.findOne(
        { $and: [{ 'lms.iss': lms.iss }, { 'lms.course_id': lms.course_id }] },
        { projection: { appversion: 1, features: 1 } }
      )
      if (lectappdoc?.appversion) appversion = lectappdoc.appversion
      if (lectappdoc?.features) features = lectappdoc.features
    }

    if (lecturedoc == null) {
      lectureuuid = uuidv4()
      // deploy data
      const toinsert = {
        ...{
          appversion,
          features,
          uuid: lectureuuid,
          date: new Date(),
          lastaccess: new Date(),
          lms: {
            ...{
              iss: lms.iss,
              // eslint-disable-next-line camelcase
              resource_id: lms.resource_id
            },
            // eslint-disable-next-line camelcase
            ...(lms.course_id && { course_id: lms.course_id }),
            // eslint-disable-next-line camelcase
            ...(lms.platform_id && { platform_id: lms.platform_id }),
            // eslint-disable-next-line camelcase
            ...(lms.deploy_id && { deploy_id: lms.deploy_id })
          }
        },
        ...(linfo.lecturetitle && { title: linfo.lecturetitle }),
        ...(linfo.coursetitle && { coursetitle: linfo.coursetitle }),
        ...(args.owner && {
          owners: [args.owner]
        }),
        ...(args.owner &&
          ((args.ownerdisplayname && {
            ownersdisplaynames: [args.ownerdisplayname]
          }) || { ownerdisplaynames: ['N.N.'] }))
      }

      await lecturescol.insertOne(toinsert)
    } else {
      if (!title && lecturedoc.title) title = lecturedoc.title
      if (!coursetitle && lecturedoc.coursetitle)
        coursetitle = lecturedoc.coursetitle

      lectureuuid = lecturedoc.uuid
      let containsowner = true
      let isowner = false
      if (args.owner) {
        if (lecturedoc.owners)
          containsowner = lecturedoc.owners.includes(args.owner)
        else containsowner = false
        isowner = true
      }

      // check if we want to update
      const toupdate = {
        ...(lecturedoc.title !== linfo.lecturetitle && {
          title: linfo.lecturetitle
        }),
        ...(lecturedoc.coursetitle !== linfo.coursetitle && {
          coursetitle: linfo.coursetitle
        }),
        ...(!lecturedoc.features && { features }),
        ...(!lecturedoc.appversion && { appversion }),
        ...(containsowner && !lecturedoc.date ? { date: new Date() } : {}),
        ...((lecturedoc.lms.course_id !== lms.course_id ||
          lecturedoc.lms.platform_id !== lms.platform_id ||
          lecturedoc.lms.deploy_id !== lms.deploy_id) && {
          lms: {
            ...lecturedoc.lms,
            ...(lecturedoc.lms.course_id !== lms.course_id && {
              // eslint-disable-next-line camelcase
              course_id: lms.course_id
            }),
            ...(lecturedoc.lms.platform_id !== lms.platform_id && {
              // eslint-disable-next-line camelcase
              platform_id: lms.platform_id
            }),
            ...(lecturedoc.lms.deploy_id !== lms.deploy_id && {
              // eslint-disable-next-line camelcase
              deploy_id: lms.deploy_id
            })
          }
        })
      }

      if (Object.keys(toupdate).length > 0 || !containsowner) {
        const updateops = {
          ...(Object.keys(toupdate).length > 0 && { $set: toupdate }),
          ...(!containsowner &&
            isowner && {
              ...{ $addToSet: { owners: args.owner } },
              ...(args.ownerdisplayname && {
                $push: { ownersdisplaynames: args.ownerdisplayname }
              })
            })
        }
        // console.log("toupdate",updateops);
        lecturescol.updateOne({ uuid: lectureuuid }, updateops)
      } else {
        if (
          !lecturedoc.lastaccess ||
          (lecturedoc.lastaccess &&
            moment(lecturedoc.lastaccess).isBefore(
              moment().subtract(3, 'days')
            ))
        ) {
          if (isowner) {
            lecturescol.updateOne(
              { uuid: lectureuuid },
              { $currentDate: { lastaccess: true } }
            )
          }
        }
      }
    }
    const retobj = { lectureuuid, appversion, features }
    // if (title) retobj.title=title;
    // if (coursetitle) retobj.coursetitle=coursetitle;

    return retobj
  }

  maintenanceExpress() {
    const secretCallback = async (
      req: Request,
      token: FailsLtiJwt | undefined
    ) => {
      if (!token) throw new Error('no token passed')
      const { payload } = token
      const keyid = payload.kid
      if (!keyid) throw new Error('no valid kid!')

      if (!payload.iss) throw new Error('no valid iss field')
      const platform = this.lmslist[payload.iss]
      if (!platform) throw new Error('platform not registered/supported')
      let keyinfo
      try {
        keyinfo = await ky.get(platform.keyset_url).json<{ keys: LtiKey[] }>()
      } catch (error) {
        console.log('Key info loading problem in maintenance:', error)
        throw new Error('cannot load key info')
      }
      const keys = keyinfo.keys
      if (!keys) throw new Error('Keyset not found')

      const jwk = keys.find((key) => {
        return key.kid === keyid
      })
      if (!jwk) throw new Error('key not found')
      let key
      try {
        key = await Jwk.export({ jwk: jwk, format: 'pkcs1', public: true })
      } catch (error) {
        console.log('Jwk export: error', error)
        throw new Error('Jwk key export problem')
      }
      return key
    }

    return jwtexpress({
      secret: secretCallback,
      algorithms: ['RS256', 'RS384', 'RS512'],
      requestProperty: 'token'
    })
  }

  async handleGetUser(req: AuthenticatedLtiRequest, res: Response) {
    const userscol = this.mongo.collection<FailsUser>('users')
    const orquery = []

    if (!req.token)
      return res.status(401).send('malformed request: token invalid or missing')
    if (
      req.body.username &&
      req.body.username.match(/^[0-9a-zA-Z._-]+$/) &&
      typeof req.body.username === 'string'
    )
      orquery.push({ 'lms.username': req.body.username })
    if (req.body.email && typeof req.body.email === 'string')
      orquery.push({ email: req.body.email })
    // per spec lmssub is a string, even it is a number for moodle
    if (req.body.lmssub && typeof req.body.lmssub === 'string')
      orquery.push({ 'lms.sub': req.body.lmssub })

    if (orquery.length === 0)
      return res
        .status(401)
        .send('malformed request: missing username or email')
    if (!req.token.iss)
      return res.status(401).send('malformed request: no issuer in token')

    try {
      /* const user = await userscol.findOne({
        $and: [{ $or: orquery }, { 'lms.iss': req.token.iss }]
      }) */ // not this is wrong, we assume that all lms share the usernames and emails with the system
      const user = await userscol.findOne({ $or: orquery })
      if (!user) return res.status(404).send('user not found')
      if (user.uuid) res.status(200).json({ uuid: user.uuid })
      else res.status(404).send('uuid not found')
    } catch (error) {
      console.log('handleGetUser error', error)
      return res.status(500).send('get user error')
    }
  }

  async handleDeleteUser(req: AuthenticatedLtiRequest, res: Response) {
    if (!validate(req.body.uuid))
      return res.status(401).send('malformed request: missing uuid')
    const useruuid = req.body.uuid
    try {
      const userscol = this.mongo.collection<FailsUser>('users')
      const lecturescol = this.mongo.collection<Lecture>('lectures')

      const deleted = await userscol.deleteMany({ uuid: useruuid })

      const mods = await lecturescol.updateMany(
        { owners: useruuid },
        { $pull: { owners: useruuid } }
      )

      res.status(200).json({
        deletedusers: deleted.deletedCount,
        modifieddocs: mods.modifiedCount
      })
    } catch (error) {
      console.log('handleDeleteUser error', error)
      return res.status(500).send('delete user error')
    }
  }

  async handleDeleteCourse(req: AuthenticatedLtiRequest, res: Response) {
    if (!req.token)
      return res.status(401).send('malformed request: token invalid or missing')
    if (!req.token.iss)
      return res.status(401).send('malformed request: missing iss')
    if (!req.body.courseid)
      return res.status(401).send('malformed request: missing courseid')
    const courseid = Number(req.body.courseid)
    if (Number.isNaN(courseid))
      return res.status(401).send('malformed request: courseid not a number')
    try {
      const lecturescol = this.mongo.collection<Lecture>('lectures')
      const mods = await lecturescol.updateMany(
        { 'lms.iss': req.token.iss, 'lms.course_id': courseid.toString() },
        { $rename: { 'lms.resource_id': 'lms.resource_id_deleted' } }
      )
      res.status(200).json({
        modifieddocs: mods.modifiedCount
      })
    } catch (error) {
      console.log('handleDeleteCourse error', error)
      return res.status(500).send('delete course error')
    }
  }

  async handleDeleteResource(req: AuthenticatedLtiRequest, res: Response) {
    if (!req.token)
      return res.status(401).send('malformed request: token invalid or missing')
    if (!req.token.iss)
      return res.status(401).send('malformed request: missing issuer')
    if (!req.body.courseid)
      return res.status(401).send('malformed request: missing courseid')
    if (!req.body.resourceid)
      return res.status(401).send('malformed request: missing resourceid')
    const courseid = Number(req.body.courseid)
    if (Number.isNaN(courseid))
      return res.status(401).send('malformed request: courseid not a number')
    const resourceid = Number(req.body.resourceid)
    if (Number.isNaN(resourceid))
      return res.status(401).send('malformed request: resourceid not a number')
    try {
      const lecturescol = this.mongo.collection<Lecture>('lectures')
      const mods = await lecturescol.updateMany(
        {
          'lms.iss': req.token.iss,
          'lms.course_id': courseid.toString(),
          'lms.resource_id': resourceid.toString()
        },
        { $rename: { 'lms.resource_id': 'lms.resource_id_deleted' } }
      )
      res.status(200).json({
        modifieddocs: mods.modifiedCount
      })
    } catch (error) {
      console.log('handleDeleteResource error', error)
      return res.status(500).send('delete resource error')
    }
  }
}
