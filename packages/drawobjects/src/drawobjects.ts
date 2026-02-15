import { ReactElement } from 'react'
import {
  ToolType,
  ColorType,
  FormType,
  Sink,
  OptTime
} from '@fails-components/data'
import Color from 'color'

type PointType = {
  x: number
  y: number
}

type GlyphPointType = PointType & {
  w: number
  press: number
}

export type DrawObjectShift = PointType

export type ShiftTarget = {
  sink: Sink
  deselect: () => void
  newobjid: (objid: number) => number
}

export type PointTest = {
  pointTest: (testobj: { x: number; y: number }) => boolean
}

export type RectType = {
  left: number
  right: number
  top: number
  bottom: number
}

export type WeightSlice = {
  weight: number
  pos: number
  min: number
  max: number
}

export type OptFormType = FormType | ''

export class DrawObject {
  constructor(type: string, objid: number) {
    this.type = type
    this.objid_ = objid
  }

  getRenderCache(id: number) {
    if (this.cacheversion === this.version && this.cacheid === id)
      return this.rendercache
    else this.rendercache = undefined
    return undefined
  }

  setRenderCache(id: number, cache: ReactElement) {
    this.rendercache = cache
    this.cacheid = id
    this.cacheversion = this.version
  }

  clearRenderCache() {
    this.rendercache = undefined
  }

  setPreshift(shift: DrawObjectShift | undefined) {
    this.preshift = shift
  }

  moveObject(x: number, y: number): void {
    throw new Error('moveObject not implemented')
  }

  getWeightSlices(numslicesheight: number): WeightSlice[] {
    throw new Error('getWeightSlices not implemented')
  }

  set preshift(shift: DrawObjectShift | undefined) {
    if (
      typeof shift !== 'undefined' &&
      shift.x !== undefined &&
      shift.y !== undefined
    ) {
      if (
        !this.preshift_ ||
        this.preshift_.x !== shift.x ||
        this.preshift_.x !== shift.y
      ) {
        this.clearRenderCache()
        this.preshift_ = { x: shift.x, y: shift.y }
      }
    } else {
      if (this.preshift_) {
        this.clearRenderCache()
        this.preshift_ = undefined
      }
    }
  }

  get preshift() {
    return this.preshift_
  }

  get uncommitted() {
    return this.uncommitted_
  }

  set uncommitted(value: boolean) {
    this.uncommitted_ = value
  }

  get objid() {
    return this.objid_
  }

  get version() {
    return this.version_
  }

  increaseVersion() {
    this.version_++
  }

  commitPreshift(target: ShiftTarget) {
    // implement in derived class
    throw new Error('commitPreshift is not implemented')
  }

  copyAndDeselect(target: ShiftTarget, shift: DrawObjectShift) {
    // implement in derived class
    // return the copied object
    throw new Error('copyAndDeselect is not implemented')
  }

  setPreview(preview: boolean) {
    if (this.preview !== preview) {
      this.preview = preview
      this.clearRenderCache()
    }
  }

  getPreview() {
    return this.preview
  }

  getArea(): RectType | undefined {
    return undefined
  }

  select() {
    this.selected = true
    this.clearRenderCache()
  }

  isSelected() {
    return this.selected
  }

  deselect() {
    this.selected = false
    this.clearRenderCache()
  }

  doPointTest(pointTest: PointTest) {
    throw new Error('doPointTest is not implemented')
  }

  storagenum(): number | undefined {
    return undefined
  }
  private type: string
  private objid_: number
  private rendercache: ReactElement | undefined
  private version_: number = 0
  private cacheversion = -1
  private cacheid = -1
  private preview = false
  private selected = false
  private preshift_: DrawObjectShift | undefined = undefined
  private uncommitted_ = false // used if the object is copied
}
export class DrawObjectPicture extends DrawObject {
  constructor(objid: number) {
    super('image', objid)
  }

  addPicture(
    x: number,
    y: number,
    width: number,
    height: number,
    uuid: string,
    url: string | undefined,
    mimetype: string | undefined,
    urlthumb: string | undefined
  ) {
    this.posx = x
    this.posy = y
    this.width = width
    this.height = height
    this.uuid = uuid
    this.url = url
    this.urlthumb = urlthumb
    this.mimetype = mimetype
    this.inited = true
    this.clearRenderCache()
  }

  getWeightSlices(numslicesheight: number) {
    if (!this.inited) throw new Error('DrawObjectPicture not inited')
    const toret = []
    const sliceposstart = Math.round(this.posy / numslicesheight)
    const sliceposend = Math.round((this.posy + this.height) / numslicesheight)
    const sliceweight = numslicesheight * this.width * 0.2 // adjust the factor

    for (let slicepos = sliceposstart; slicepos < sliceposend; slicepos++) {
      toret.push({
        weight: sliceweight,
        pos: slicepos,
        min: Math.min(this.posy, this.posy + this.height),
        max: Math.max(this.posy, this.posy + this.height)
      })
    }
    return toret
  }

  moveObject(x: number, y: number) {
    if (!this.inited) throw new Error('DrawObjectPicture not inited')
    this.posx = x
    this.posy = y
    this.preshift = undefined
    this.clearRenderCache()
  }

  doPointTest(testobj: PointTest) {
    if (!this.inited) throw new Error('DrawObjectPicture not inited')
    // four corners
    if (
      !testobj.pointTest({
        x: this.posx * this.svgscale,
        y: this.posy * this.svgscale
      })
    )
      return false
    if (
      !testobj.pointTest({
        x: (this.posx + this.width) * this.svgscale,
        y: this.posy * this.svgscale
      })
    )
      return false
    if (
      !testobj.pointTest({
        x: (this.posx + this.width) * this.svgscale,
        y: (this.posy + this.height) * this.svgscale
      })
    )
      return false
    if (
      !testobj.pointTest({
        x: this.posx * this.svgscale,
        y: (this.posy + this.height) * this.svgscale
      })
    )
      return false
    const dscan = 0.2 // 5 by 5 and yes we double test the corners
    for (let scanx = 0; scanx <= 1.0; scanx += dscan) {
      for (let scany = 0; scany <= 1.0; scany += dscan) {
        if (
          !testobj.pointTest({
            x: (this.posx + this.width * scanx) * this.svgscale,
            y: (this.posy + this.height * scany) * this.svgscale
          })
        )
          return false
      }
    }

    return true
  }

  getArea() {
    if (!this.inited) throw new Error('DrawObjectPicture not inited')
    return {
      left: Math.min(this.posx, this.posx + this.width),
      right: Math.max(this.posx, this.posx + this.width),
      top: Math.min(this.posy, this.posy + this.height),
      bottom: Math.max(this.posy, this.posy + this.height)
    }
  }

  commitPreshift(target: ShiftTarget) {
    if (!this.inited) throw new Error('DrawObjectPicture not inited')
    if (!this.preshift && !this.uncommitted) return
    if (target) {
      const newstorage = Math.floor(this.posy + (this.preshift?.y ?? 0))
      if (newstorage !== this.storagenum() || this.uncommitted) {
        // ok we have to delete the old obj and create a new one
        let newobjid
        if (!this.uncommitted) {
          target.sink.deleteObject(
            undefined,
            this.objid,
            undefined,
            this.storagenum()
          )
          newobjid = target.newobjid(this.objid)
        } else {
          newobjid = this.objid
        }
        target.sink.addPicture(
          undefined,
          newobjid,
          undefined,
          this.posx + (this.preshift?.x ?? 0),
          this.posy + (this.preshift?.y ?? 0),
          this.width,
          this.height,
          this.uuid
        )
        target.deselect() // signals that the selection should be removed
        this.uncommitted = false
      } else {
        // ok we just move
        target.sink.moveObject(
          undefined,
          this.objid,
          undefined,
          this.posx + (this.preshift?.x ?? 0),
          this.posy + (this.preshift?.y ?? 0)
        )
      }
    }
    this.clearRenderCache()
  }

  copyAndDeselect(target: ShiftTarget, shift: DrawObjectShift) {
    if (!this.inited) throw new Error('DrawObjectPicture not inited')
    const newobj = new DrawObjectPicture(target.newobjid(this.objid))
    newobj.uncommitted = true
    newobj.addPicture(
      this.posx + (this.preshift?.x ?? 0) + shift.x,
      this.posy + (this.preshift?.y ?? 0) + shift.y,
      this.width,
      this.height,
      this.uuid,
      this.url,
      this.mimetype,
      this.urlthumb
    )
    this.deselect()
    newobj.select()
    return newobj
  }

  storagenum() {
    return Math.floor(this.posy)
  }

  private svgscale = 2000 // should be kept constant

  private inited: boolean = false
  private posx: number = 0
  private posy: number = 0
  private width: number = 0
  private height: number = 0
  private uuid: string = ''
  private url: string | undefined = undefined
  private urlthumb: string | undefined = undefined
  private mimetype: string | undefined = undefined
}

export class DrawObjectForm extends DrawObject {
  constructor(objid: number) {
    super('form', objid)
  }

  addForm(
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: ColorType,
    fColor: ColorType,
    lw: number
  ) {
    this.posx = x
    this.posy = y
    this.width = width
    this.height = height
    this.formtype = type
    this.bColor = bColor
    this.fColor = fColor
    this.lw = lw
    this.inited = true
    this.clearRenderCache()
  }

  getWeightSlices(numslicesheight: number) {
    if (!this.inited) throw new Error('DrawObjectForm not inited')
    const toret = []
    const sliceposstart = Math.round(this.posy / numslicesheight)
    const sliceposend = Math.round((this.posy + this.height) / numslicesheight)
    let sliceweight
    let opague = false
    if ((this.fColor & 0xff000000) >>> 24 !== 0) opague = true
    // const posx = Math.min(this.posx: number, this.posx + this.width)
    const posy = Math.min(this.posy, this.posy + this.height)
    const width = Math.abs(this.width)
    const height = Math.abs(this.height)
    switch (this.formtype) {
      case 2: // rectangle
        if (opague) {
          sliceweight = () =>
            (width * numslicesheight) / this.svgscale / this.svgscale
        } else {
          sliceweight = (slicepos: number) => {
            let weigth =
              (this.lw * numslicesheight) / this.svgscale / this.svgscale
            if (
              (slicepos * numslicesheight < posy &&
                posy <= (slicepos + 1) * numslicesheight) ||
              (slicepos * numslicesheight < posy + height &&
                posy + height <= (slicepos + 1) * numslicesheight)
            )
              weigth += (width * this.lw) / this.svgscale / this.svgscale
            return weigth
          }
        }
        break
      case 3: // circle, actually the same except for manipulation
      case 4: // ellipse
        if (opague) {
          sliceweight = (slicepos: number) => {
            const yunitcircle =
              ((slicepos + 0.5) * numslicesheight - posy) / (height * 0.5) - 1
            const xunitcircle = Math.sqrt(1 - yunitcircle * yunitcircle)
            return (
              (xunitcircle * 2 * width * numslicesheight) /
              this.svgscale /
              this.svgscale
            )
          }
        } else {
          sliceweight = (slicepos: number) => {
            const yunitcircle =
              ((slicepos + 0.5) * numslicesheight - posy) / (height * 0.5) - 1
            const liney = numslicesheight
            const linex = Math.abs(yunitcircle) * this.width

            return (
              (Math.sqrt(liney * liney + linex * linex) * this.lw) /
              this.svgscale /
              this.svgscale
            )
          }
        }
        break

      case 1:
      default:
        // line
        if (this.height === 0)
          sliceweight = () => (width * this.lw) / this.svgscale / this.svgscale
        else {
          const m = width / height
          sliceweight = () =>
            (numslicesheight * m) / this.svgscale / this.svgscale
        }
        break
    }

    for (let slicepos = sliceposstart; slicepos < sliceposend; slicepos++) {
      toret.push({
        weight: sliceweight(slicepos),
        pos: slicepos,
        min: posy,
        max: posy + height
      })
    }
    return toret
  }

  moveObject(x: number, y: number) {
    if (!this.inited) throw new Error('DrawObjectForm not inited')
    this.posx = x
    this.posy = y
    this.preshift = undefined
    this.clearRenderCache()
  }

  doPointTest(testobj: PointTest) {
    if (!this.inited) throw new Error('DrawObjectForm not inited')
    switch (this.formtype) {
      case 2: // line
        return this.doPointTestRect(testobj)
      case 3: // Circle
      case 4: // Ellipse
        return this.doPointTestEllipseCircle(testobj)
      case 1: // line
      default:
        return this.doPointTestLine(testobj)
    }
  }

  doPointTestEllipseCircle(testobj: PointTest) {
    const radiusx = Math.abs(this.width) * 0.5
    const radiusy = Math.abs(this.height) * 0.5
    const px = this.posx + this.width * 0.5
    const py = this.posy + this.height * 0.5

    let opague = false
    if ((this.fColor & 0xff000000) >>> 24 !== 0) opague = true

    if (!opague) {
      for (let phi = 0; phi < 2 * Math.PI; phi += (2 * Math.PI) / 20) {
        if (
          !testobj.pointTest({
            x: (px + radiusx * Math.sin(phi)) * this.svgscale,
            y: (py + radiusy * Math.cos(phi)) * this.svgscale
          })
        )
          return false
      }
    } else {
      const dscan = 0.2 // 5 by 5 and yes we double test the corners
      for (let scany = 0; scany <= 1.0; scany += dscan) {
        const yunitcircle = scany * 2 - 1
        const xoffset = 0.5 * (1 - Math.sqrt(1 - yunitcircle * yunitcircle))
        for (let scanx = xoffset; scanx <= 1.0 - xoffset; scanx += dscan) {
          if (
            !testobj.pointTest({
              x: (this.posx + this.width * scanx) * this.svgscale,
              y: (this.posy + this.height * scany) * this.svgscale
            })
          )
            return false
        }
      }
    }

    return true
  }

  doPointTestLine(testobj: PointTest) {
    const dscan = 0.05 // 20 tests

    for (let scan = 0; scan <= 1.0; scan += dscan) {
      if (
        !testobj.pointTest({
          x: (this.posx + this.width * scan) * this.svgscale,
          y: (this.posy + this.height * scan) * this.svgscale
        })
      )
        return false
    }

    return true
  }

  doPointTestRect(testobj: PointTest) {
    let opague = false
    if ((this.fColor & 0xff000000) >>> 24 !== 0) opague = true
    // four corners
    if (
      !testobj.pointTest({
        x: this.posx * this.svgscale,
        y: this.posy * this.svgscale
      })
    )
      return false
    if (
      !testobj.pointTest({
        x: (this.posx + this.width) * this.svgscale,
        y: this.posy * this.svgscale
      })
    )
      return false
    if (
      !testobj.pointTest({
        x: (this.posx + this.width) * this.svgscale,
        y: (this.posy + this.height) * this.svgscale
      })
    )
      return false
    if (
      !testobj.pointTest({
        x: this.posx * this.svgscale,
        y: (this.posy + this.height) * this.svgscale
      })
    )
      return false
    const dscan = 0.2 // 5 by 5 and yes we double test the corners
    if (opague) {
      for (let scanx = 0; scanx <= 1.0; scanx += dscan) {
        for (let scany = 0; scany <= 1.0; scany += dscan) {
          if (
            !testobj.pointTest({
              x: (this.posx + this.width * scanx) * this.svgscale,
              y: (this.posy + this.height * scany) * this.svgscale
            })
          )
            return false
        }
      }
    } else {
      let scany, scanx
      // top and bottom
      for (scanx = 0; scanx <= 1.0; scanx += dscan) {
        scany = 0
        if (
          !testobj.pointTest({
            x: (this.posx + this.width * scanx) * this.svgscale,
            y: (this.posy + this.height * scany) * this.svgscale
          })
        )
          return false
        scany = 1.0
        if (
          !testobj.pointTest({
            x: (this.posx + this.width * scanx) * this.svgscale,
            y: (this.posy + this.height * scany) * this.svgscale
          })
        )
          return false
      }
      // left and right
      for (scany = 0; scany <= 1.0; scany += dscan) {
        scanx = 0
        if (
          !testobj.pointTest({
            x: (this.posx + this.width * scanx) * this.svgscale,
            y: (this.posy + this.height * scany) * this.svgscale
          })
        )
          return false
        scanx = 1
        if (
          !testobj.pointTest({
            x: (this.posx + this.width * scanx) * this.svgscale,
            y: (this.posy + this.height * scany) * this.svgscale
          })
        )
          return false
      }
    }

    return true
  }

  getArea() {
    if (!this.inited) throw new Error('DrawObjectForm not inited')
    return {
      left: Math.min(this.posx, this.posx + this.width),
      right: Math.max(this.posx, this.posx + this.width),
      top: Math.min(this.posy, this.posy + this.height),
      bottom: Math.max(this.posy, this.posy + this.height)
    }
  }

  commitPreshift(target: ShiftTarget) {
    if (!this.inited || this.formtype === '')
      throw new Error('DrawObjectForm not inited')
    if (!this.preshift && !this.uncommitted) return
    if (target) {
      const newstorage = Math.floor(this.posy + (this.preshift?.y ?? 0))
      if (newstorage !== this.storagenum() || this.uncommitted) {
        // ok we have to delete the old obj and create a new one
        let newobjid
        if (!this.uncommitted) {
          target.sink.deleteObject(
            undefined,
            this.objid,
            undefined,
            this.storagenum()
          )
          newobjid = target.newobjid(this.objid)
        } else {
          newobjid = this.objid
        }
        target.sink.addForm(
          undefined,
          newobjid,
          undefined,
          this.posx + (this.preshift?.x ?? 0),
          this.posy + (this.preshift?.y ?? 0),
          this.width,
          this.height,
          this.formtype,
          this.bColor,
          this.fColor,
          this.lw
        )
        target.deselect() // signals that the selection should be removed
        this.uncommitted = false
      } else {
        // ok we just move
        target.sink.moveObject(
          undefined,
          this.objid,
          undefined,
          this.posx + (this.preshift?.x ?? 0),
          this.posy + (this.preshift?.y ?? 0)
        )
      }
    }
    this.clearRenderCache()
  }

  copyAndDeselect(target: ShiftTarget, shift: DrawObjectShift) {
    if (!this.inited || this.formtype === '')
      throw new Error('DrawObjectForm not inited')
    const newobj = new DrawObjectForm(target.newobjid(this.objid))
    newobj.uncommitted = true
    newobj.addForm(
      this.posx + (this.preshift?.x ?? 0) + shift.x,
      this.posy + (this.preshift?.y ?? 0) + shift.y,
      this.width,
      this.height,
      this.formtype,
      this.bColor,
      this.fColor,
      this.lw
    )
    this.deselect()
    newobj.select()
    return newobj
  }

  storagenum() {
    return Math.floor(this.posy)
  }

  private svgscale = 2000 // should be kept constant

  private inited: boolean = false

  private posx: number = 0
  private posy: number = 0
  private width: number = 0
  private height: number = 0
  private formtype: OptFormType = ''
  private bColor: ColorType = 0
  private fColor: ColorType = 0
  private lw: number = 0
}

export class DrawObjectGlyph extends DrawObject {
  constructor(objid: number) {
    super('glyph', objid)
  }

  storagenum() {
    return this.stornum
  }

  startPath(
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    width: number,
    pressure: number
  ) {
    const scolor = Color(color).hex()

    const penwidth = this.svgscale * width

    let penw = penwidth
    let curpress = pressure ?? 0.5
    penw *= curpress * 0.5 * 2 + 0.5

    const px = x * this.svgscale
    const py = y * this.svgscale

    this.stornum = Math.floor(y)

    this.startpoint = { x: px, y: py }
    this.lastpoint = { x: px, y: py }
    this.gtype = type
    /*  workpathstart: "",
            workpathend:"Z", */
    this.pressure = curpress
    this.pathpoints = [
      { x: px, y: py, w: penw, press: pressure ?? this.pressure }
    ]
    this.startradius = penw * 0.5
    this.penwidth = penwidth
    this.color = scolor
    this.area = {
      left: -2 * penw,
      right: 2 * penw,
      top: -2 * penw,
      bottom: 2 * penw
    }

    this.increaseVersion() // increment version
    this.clearRenderCache()
  }

  addToPath(x: number, y: number, pressure: number) {
    const px = x * this.svgscale
    const py = y * this.svgscale
    if (typeof this.lastpoint === 'undefined')
      throw new Error('lastpoint not set')
    if (typeof this.startpoint === 'undefined')
      throw new Error('startpoint not set')

    const wx = this.lastpoint.x
    const wy = this.lastpoint.y
    const sx = this.startpoint.x
    const sy = this.startpoint.y
    let dx = px - wx
    let dy = py - wy
    let wpenw = this.penwidth
    // console.log("status pressure", pressure: number,wpenw);
    // console.log("atopath",wx: number,px: number,wy: number,py);
    const norm = Math.sqrt(dx * dx + dy * dy)
    if (norm < this.penwidth * 0.05) {
      return // ok folks filter the nonsense out
    }

    let curpress = pressure ?? 0.5

    const fac = 0.1
    curpress = curpress * fac + (1 - fac) * this.pressure
    // console.log("pressure problem",curpress,0.5+curpress,wpenw);
    wpenw *= 0.5 * curpress * 2 + 0.5

    dx *= 1 / norm
    dy *= 1 / norm

    const ws = this.area
    const pw = wpenw
    this.lastpoint = { x: px, y: py }
    this.pathpoints.push({
      x: px,
      y: py,
      w: pw,
      press: pressure ?? this.pressure
    })
    this.area = {
      left: Math.min(px - sx - 2 * pw, ws.left),
      right: Math.max(px - sx + 2 * pw, ws.right),
      top: Math.min(py - sy - 2 * pw, ws.top),
      bottom: Math.max(py - sy + 2 * pw, ws.bottom)
    }
    this.pressure = curpress
    this.increaseVersion()
    this.clearRenderCache()
  }

  finishPath() {
    // so far a nop
    this.increaseVersion()
    this.clearRenderCache()
  }

  moveObject(x: number, y: number) {
    if (this.pathpoints && this.pathpoints.length > 0) {
      const rx = x * this.svgscale - this.pathpoints[0].x
      const ry = y * this.svgscale - this.pathpoints[0].y
      for (let ind = 0; ind < this.pathpoints.length; ind++) {
        this.pathpoints[ind].x += rx
        this.pathpoints[ind].y += ry
      }
      if (this.startpoint) {
        this.startpoint.x += rx
        this.startpoint.y += ry
      }
      if (this.lastpoint) {
        this.lastpoint.x += rx
        this.lastpoint.y += ry
      }
      this.increaseVersion()
      this.clearRenderCache()
      this.preshift = undefined
    }
  }

  doPointTest(testobj: PointTest) {
    if (!this.pathpoints || this.pathpoints.length === 0) return false
    if (!testobj.pointTest(this.pathpoints[0])) return false
    if (this.pathpoints.length === 1) return true
    if (!testobj.pointTest(this.pathpoints[this.pathpoints.length - 1]))
      return false

    return this.intDoPointTest(testobj, 0, this.pathpoints.length, 8)
  }

  intDoPointTest(
    testobj: PointTest,
    lower: number,
    upper: number,
    stack: number
  ) {
    const middle = lower + Math.floor((upper - lower) * 0.5)
    if (middle === lower) return true // none left
    if (!testobj.pointTest(this.pathpoints[middle])) return false

    if (stack === 0) return true
    const half1 = this.intDoPointTest(testobj, lower, middle, stack - 1)
    const half2 = this.intDoPointTest(testobj, middle, upper, stack - 1)
    if (!half1 || !half2) return false
    return true
  }

  commitPreshift(target: ShiftTarget) {
    if (!this.preshift && !this.uncommitted) return
    if (target && this.pathpoints.length > 0) {
      const newstorage = Math.floor(
        (this.preshift?.y ?? 0) + this.pathpoints[0].y * this.isvgscale
      )
      const oldstorage = this.storagenum()
      if (newstorage !== oldstorage || this.uncommitted) {
        // ok we have to delete the old obj and create a new one
        this.stornum = newstorage
        let newobjid
        if (!this.uncommitted) {
          newobjid = target.newobjid(this.objid)
        } else {
          newobjid = this.objid
        }
        target.sink.startPath(
          undefined,
          newobjid,
          undefined,
          this.pathpoints[0].x * this.isvgscale + (this.preshift?.x ?? 0),
          this.pathpoints[0].y * this.isvgscale + (this.preshift?.y ?? 0),
          this.gtype,
          Color(this.color).rgbNumber(),
          this.penwidth * this.isvgscale,
          this.pathpoints[0].press
        )
        for (let i = 1; i < this.pathpoints.length; i++) {
          target.sink.addToPath(
            undefined,
            newobjid,
            undefined,
            this.pathpoints[i].x * this.isvgscale + (this.preshift?.x ?? 0),
            this.pathpoints[i].y * this.isvgscale + (this.preshift?.y ?? 0),
            this.pathpoints[i].press
          )
        }
        target.sink.finishPath(undefined, newobjid, undefined)
        if (!this.uncommitted)
          target.sink.deleteObject(undefined, this.objid, undefined, oldstorage)
        target.deselect() // signals that the selection should be removed
        this.uncommitted = false
      } else {
        // ok we just move
        target.sink.moveObject(
          undefined,
          this.objid,
          undefined,
          this.pathpoints[0].x * this.isvgscale + (this.preshift?.x ?? 0),
          this.pathpoints[0].y * this.isvgscale + (this.preshift?.y ?? 0)
        )
      }
    }
    this.clearRenderCache()
  }

  copyAndDeselect(target: ShiftTarget, shift: DrawObjectShift) {
    const newobj = new DrawObjectGlyph(target.newobjid(this.objid))
    newobj.uncommitted = true
    newobj.startPath(
      this.pathpoints[0].x * this.isvgscale + (this.preshift?.x ?? 0) + shift.x,
      this.pathpoints[0].y * this.isvgscale + (this.preshift?.y ?? 0) + shift.y,
      this.gtype,
      Color(this.color).rgbNumber(),
      this.penwidth * this.isvgscale,
      this.pathpoints[0].press
    )
    for (let i = 1; i < this.pathpoints.length; i++) {
      newobj.addToPath(
        this.pathpoints[i].x * this.isvgscale +
          (this.preshift?.x ?? 0) +
          shift.x,
        this.pathpoints[i].y * this.isvgscale +
          (this.preshift?.y ?? 0) +
          shift.y,
        this.pathpoints[i].press
      )
    }
    newobj.finishPath()
    newobj.select()
    this.deselect()
    return newobj
  }

  SVGPath() {
    if (this.svgpathversion === this.version) {
      // console.log("cached path", this.svgpathstring);
      return this.svgpathstring // perfect no work todo
    }

    const glyph = this
    if (glyph.pathpoints && glyph.pathpoints.length > 2) {
      // was 2
      // let lastpoint = null
      // if (glyph.pathpoints && glyph.pathpoints.length > 2)
      //   lastpoint = glyph.pathpoints[glyph.pathpoints.length - 1]
      let firstpoint = null
      if (glyph.pathpoints && glyph.pathpoints.length > 0)
        firstpoint = glyph.pathpoints[0]

      const sx = firstpoint ? firstpoint.x : 0
      const sy = firstpoint ? firstpoint.y : 0
      // console.log(glyph.pathpoints);
      const harr = glyph.pathpoints.length + 1
      const pathstrings = new Array(2 * harr + 1)
      // let lastnx=null;
      // let lastny=null;
      for (let i = 0; i < glyph.pathpoints.length; i++) {
        const curpoint = glyph.pathpoints[i]
        let dx = 0
        let dy = 0
        if (i > 0) {
          dx += curpoint.x - glyph.pathpoints[i - 1].x
          dy += curpoint.y - glyph.pathpoints[i - 1].y
        }

        if (i + 1 < glyph.pathpoints.length) {
          dx += glyph.pathpoints[i + 1].x - curpoint.x
          dy += glyph.pathpoints[i + 1].y - curpoint.y
        }

        let norm = Math.sqrt(dx * dx + dy * dy)

        if (norm < curpoint.w * 0.5 * 0.1) {
          // very rare case, but very stupid
          if (i === 0) continue
          dx = curpoint.x - glyph.pathpoints[i - 1].x
          dy = curpoint.y - glyph.pathpoints[i - 1].y
          norm = Math.sqrt(dx * dx + dy * dy)
        }
        if (norm > 0) {
          dx *= 1 / norm
          dy *= 1 / norm
        }
        // now use cross product with (0,0,1)
        const nx = dy * curpoint.w * 0.5
        const ny = -dx * curpoint.w * 0.5

        let wsadd = ''

        if (i === 0) {
          // wsadd="M"+(curpoint.x-sx+nx).toFixed(2)+","+(curpoint.y-sy+ny).toFixed(2)+" ";
        } else {
          wsadd =
            'L' +
            (curpoint.x - sx + nx).toFixed(2) +
            ',' +
            (curpoint.y - sy + ny).toFixed(2) +
            ' '
        }
        const weadd =
          'L' +
          (curpoint.x - sx - nx).toFixed(2) +
          ',' +
          (curpoint.y - sy - ny).toFixed(2) +
          ' '

        pathstrings[i + 1] = wsadd
        pathstrings[2 * harr - i - 1] = weadd
        if (i === 0) {
          pathstrings[0] =
            'M' +
            (curpoint.x - sx - nx).toFixed(2) +
            ',' +
            (curpoint.y - sy - ny).toFixed(2) +
            ' '
          pathstrings[1] =
            'A' +
            (curpoint.w * 0.5).toFixed(2) +
            ',' +
            (curpoint.w * 0.5).toFixed(2) +
            ',0,1,1,' +
            (curpoint.x - sx + nx).toFixed(2) +
            ',' +
            (curpoint.y - sy + ny).toFixed(2) +
            ' '
        }
        if (i === glyph.pathpoints.length - 1) {
          pathstrings[harr] =
            'A' +
            (curpoint.w * 0.5).toFixed(2) +
            ',' +
            (curpoint.w * 0.5).toFixed(2) +
            ',0,1,1,' +
            (curpoint.x - sx - nx).toFixed(2) +
            ',' +
            (curpoint.y - sy - ny).toFixed(2) +
            ' '
        }
      }
      pathstrings[2 * harr] = 'Z'
      // console.log("pathstrings mystery", pathstrings);
      this.svgpathstring = pathstrings.join('')
      this.svgpathversion = this.version
      // console.log("calculated path", this.svgpathstring);
      return this.svgpathstring
    } else if (glyph.pathpoints && glyph.pathpoints.length > 0) {
      // single point case
      let firstpoint = null
      if (glyph.pathpoints && glyph.pathpoints.length > 0)
        firstpoint = glyph.pathpoints[0]
      const sx = firstpoint ? firstpoint.x : 0
      const sy = firstpoint ? firstpoint.y : 0

      const curpoint = glyph.pathpoints[0]
      // handle single point
      this.svgpathstring =
        'M' +
        (curpoint.x - curpoint.w * 0.5 - sx).toFixed(2) +
        ',' +
        (curpoint.y - sy).toFixed(2) +
        ' ' +
        'A' +
        (curpoint.w * 0.5).toFixed(2) +
        ',' +
        (curpoint.w * 0.5).toFixed(2) +
        ',0,1,1,' +
        (curpoint.x + curpoint.w * 0.5 - sx).toFixed(2) +
        ',' +
        (curpoint.y - sy).toFixed(2) +
        'A' +
        (curpoint.w * 0.5).toFixed(2) +
        ',' +
        (curpoint.w * 0.5).toFixed(2) +
        ',0,1,1,' +
        (curpoint.x - curpoint.w * 0.5 - sx).toFixed(2) +
        ',' +
        (curpoint.y - sy).toFixed(2) +
        ' Z'
      this.svgpathversion = this.version
      // console.log("single point svg", this.svgpathstring);
      return this.svgpathstring
    } else return null
  }

  getWeightSlices(numslicesheight: number) {
    const glyph = this
    const toret = []
    const lastpoint = glyph.pathpoints[0]
    for (let i = 1; i < glyph.pathpoints.length; i++) {
      const curpoint = glyph.pathpoints[i]
      if (isNaN(curpoint.x) || isNaN(curpoint.y) || isNaN(curpoint.w)) continue
      const weight =
        (Math.sqrt(
          (lastpoint.x - curpoint.x) * (lastpoint.x - curpoint.x) +
            (lastpoint.y - curpoint.y) * (lastpoint.y - curpoint.y)
        ) *
          curpoint.w) /
        this.svgscale /
        this.svgscale
      const slicepos = Math.round(
        ((lastpoint.y + curpoint.y) * 0.5) / this.svgscale / numslicesheight
      )
      toret.push({
        weight: weight,
        pos: slicepos,
        min: (curpoint.y - curpoint.w) / this.svgscale,
        max: (curpoint.y + curpoint.w) / this.svgscale
      })
    }

    return toret
  }

  getArea() {
    if (typeof this.startpoint === 'undefined') return undefined
    const sx = this.startpoint.x
    const sy = this.startpoint.y
    return {
      left: (this.area.left + sx) * this.isvgscale,
      right: (this.area.right + sx) * this.isvgscale,
      top: (this.area.top + sy) * this.isvgscale,
      bottom: (this.area.bottom + sy) * this.isvgscale
    }
  }

  private svgscale = 2000 // should be kept constant
  private isvgscale = 1 / this.svgscale
  private svgpathversion = -1
  private svgpathstring: string | undefined = undefined
  private stornum: number | undefined = undefined

  private startpoint: PointType | undefined = undefined
  private lastpoint: PointType | undefined = undefined
  private gtype: ToolType = 0
  private pressure: number = 0
  private pathpoints: GlyphPointType[] = []
  private startradius: number = 0
  private penwidth: number = 0
  private color: string = ''
  private area: RectType = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
}

type PictureInfo = {
  sha: string
  url: string
  urlthumb: string
  mimetype: string
}

type PicturesInfo = {
  usedpictures: PictureInfo[]
}

export class DrawObjectContainer implements Sink {
  constructor(args?: { info: PicturesInfo }) {
    if (args?.info?.usedpictures) this.pictures = args.info.usedpictures
    else this.pictures = []
    this.resetDrawing()
  }

  resetDrawing() {
    this.objects_ = []
    this.workobj = {}
  }

  addPicture(
    _time: OptTime,
    objnum: number,
    _curclient: number,
    x: number,
    y: number,
    width: number,
    height: number,
    uuid: string
  ) {
    const pictinfo = this.pictures.find((el) => el.sha === uuid)

    const addpict = new DrawObjectPicture(objnum)

    addpict.addPicture(
      x,
      y - this.yoffset_,
      width,
      height,
      uuid,
      pictinfo ? pictinfo.url : undefined,
      pictinfo ? pictinfo.mimetype : undefined,
      pictinfo ? pictinfo.urlthumb : undefined
    )

    this.objects_.push(addpict)
  }

  addForm(
    _time: OptTime,
    objnum: number,
    _curclient: number,
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: ColorType,
    fColor: ColorType,
    lw: number
  ) {
    const addform = new DrawObjectForm(objnum)

    addform.addForm(
      x,
      y - this.yoffset_,
      width,
      height,
      type,
      bColor,
      fColor,
      lw
    )

    this.objects_.push(addform)
  }

  startPath(
    _time: OptTime,
    objnum: number,
    _curclient: number,
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    w: number,
    pressure: number
  ) {
    const newobj = new DrawObjectGlyph(objnum)
    this.workobj[objnum] = newobj
    this.objects_.push(this.workobj[objnum])
    newobj.startPath(x, y - this.yoffset_, type, color, w, pressure)
  }

  addToPath(
    _time: OptTime,
    objid: number,
    _curclient: number,
    x: number,
    y: number,
    pressure: number
  ) {
    if (this.workobj[objid]) {
      const curobj = this.workobj[objid] as DrawObjectGlyph
      // TODO handle objid
      curobj.addToPath(x, y - this.yoffset_, pressure)
    }
  }

  finishPath(_time: OptTime, objid: number, curclient: number) {
    if (this.workobj[objid]) {
      const curobj = this.workobj[objid] as DrawObjectGlyph
      curobj.finishPath()
      delete this.workobj[objid]
    }
  }

  scrollBoard(time: OptTime, clientnum: string, x: number, y: number) {
    // do ... nothing....
  }

  deleteObject(
    time: OptTime,
    objnum: number,
    curclient: number,
    storagenum: number
  ) {
    if (this.workobj[objnum]) {
      delete this.workobj[objnum]
    }
    this.objects_ = this.objects_.filter((el) => el.objid !== objnum)
  }

  moveObject(
    _time: OptTime,
    objnum: number,
    _curclient: number,
    x: number,
    y: number
  ) {
    if (!this.objects_) return
    this.objects_.forEach((el) => {
      if (el.objid === objnum) {
        el.moveObject(x, y - this.yoffset_)
      }
    })
  }

  startApp(
    time: OptTime,
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    sha: string,
    appid: string
  ): void {}

  moveApp(
    time: OptTime,
    x: number,
    y: number,
    width: number,
    height: number,
    deactivate: boolean
  ): void {}

  closeApp(time: OptTime): void {}

  dataApp(time: OptTime, buffer: Uint8Array | ArrayBuffer): void {}

  set yoffset(val: number | undefined) {
    if (typeof val === 'number') {
      this.yoffset_ = val
    } else {
      this.yoffset_ = 0
    }
  }

  get objects() {
    return this.objects_
  }

  private yoffset_: number = 0
  private pictures: PictureInfo[]
  private objects_: DrawObject[] = []
  private workobj: { [key: number]: DrawObject } = {}
}

// this object determines the area covered with drawings, New Implementation
// it is used for finding the best position for a pagebreak in a pdf
// TODO rewrite using objects
export class DrawArea3 extends DrawObjectContainer {
  constructor(args?: { info: PicturesInfo }) {
    super(args)
    this.addSlice = this.addSlice.bind(this)
  }

  addSlice(slice: WeightSlice) {
    if (typeof this.slices[slice.pos] === 'undefined')
      this.slices[slice.pos] = slice.weight
    else this.slices[slice.pos] += slice.weight
    this.glomin = Math.min(this.glomin, slice.min)
    this.glomax = Math.max(this.glomax, slice.max)
  }

  calculateWeights() {
    for (let ind = 0; ind < this.objects.length; ind++) {
      if (this.objects[ind]) {
        const slices = this.objects[ind].getWeightSlices(this.numslicesheight)
        slices.forEach(this.addSlice)
      }
    }
  }

  findPagebreak(pagemin: number, pagemax: number) {
    let lastquality = 1000
    let selpagebreak = pagemax

    const maxslicepos = Math.round(pagemax / this.numslicesheight)
    const minslicepos = Math.round(pagemin / this.numslicesheight)

    for (let index = maxslicepos; index >= minslicepos; index--) {
      const pagebreak = (index + 0.5) * this.numslicesheight

      let density = 0.00001 * 0

      if (typeof this.slices[index] !== 'undefined') {
        density += this.slices[index]
      }

      const quality =
        density * (1 + 4 * (pagemax - pagebreak) * (pagemax - pagebreak))

      if (quality < lastquality) {
        selpagebreak = pagebreak
        lastquality = quality
      }
    }
    return selpagebreak
  }

  private numslicesheight = (1.41 * 3) / 297 // the slice height to be roughly 3 mm
  private slices: number[] = []

  private glomin = 0
  private glomax = 0
}
