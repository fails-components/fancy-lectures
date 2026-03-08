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

const now = () => performance.now()

/*
export enum ToolType {
  TTPen = 0,
  TTMarker = 1,
  TTEraser = 2
}

export enum FormType {
  FTLine = 1,
  FTRect = 2,
  FTCircle = 3,
  FTEllipse = 4
}
*/
export type ToolType = number
export type FormType = number

export type DrawContainerId = number
export type SpecialContainerId = 'command' | 'jupyter'
export type ContainerId = SpecialContainerId | DrawContainerId
export type ClientType = string
export type ColorType = number // rgb int number
export type Time = number
export type OptTime = Time | undefined
export type ClientNum = number
export type OptClientNum = ClientNum | undefined

export interface ScrollSink {
  scrollBoard(time: OptTime, clientnum: ClientType, x: number, y: number): void
}

export interface Sink {
  startPath(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    width: number,
    pressure: number
  ): void

  addToPath(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number,
    pressure: number
  ): void

  finishPath(time: OptTime, objnum: number, curclient: OptClientNum): void

  scrollBoard(time: OptTime, clientnum: ClientType, x: number, y: number): void

  addPicture(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    uuid: string
  ): void

  addForm(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: ColorType,
    fColor: ColorType,
    lw: number
  ): void

  deleteObject(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    storagenum: DrawContainerId | null | undefined
  ): void

  moveObject(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number
  ): void
  // note a change of storagenum is not allowed

  startApp(
    time: OptTime,
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    sha: string,
    appid: string
  ): void

  moveApp(
    time: OptTime,
    x: number,
    y: number,
    width: number,
    height: number,
    deactivate: boolean
  ): void

  closeApp(time: OptTime): void

  dataApp(time: OptTime, buffer: Uint8Array | ArrayBuffer): void
}

export class DummySink implements Sink {
  startPath(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    width: number,
    pressure: number
  ): void {}

  addToPath(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number,
    pressure: number
  ): void {}

  finishPath(time: OptTime, objnum: number, curclient: OptClientNum): void {}

  scrollBoard(
    time: OptTime,
    clientnum: ClientType,
    x: number,
    y: number
  ): void {}

  addPicture(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    uuid: string
  ): void {}

  addForm(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: ColorType,
    fColor: ColorType,
    lw: number
  ): void {}

  deleteObject(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    storagenum: DrawContainerId | null | undefined
  ): void {}

  moveObject(
    time: OptTime,
    objnum: number,
    curclient: OptClientNum,
    x: number,
    y: number
  ): void {}
  // note a change of storagenum is not allowed

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
}

export interface StrictSink {
  startPath(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    width: number,
    pressure: number
  ): void

  addToPath(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    pressure: number
  ): void

  finishPath(time: Time, objnum: number, curclient: ClientNum): void

  scrollBoard(time: Time, clientnum: ClientType, x: number, y: number): void

  addPicture(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    uuid: string
  ): void

  addForm(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: ColorType,
    fColor: ColorType,
    lw: number
  ): void

  deleteObject(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    storagenum: DrawContainerId | null | undefined
  ): void

  moveObject(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number
  ): void
  // note a change of storagenum is not allowed

  startApp(
    time: Time,
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    sha: string,
    appid: string
  ): void

  moveApp(
    time: Time,
    x: number,
    y: number,
    width: number,
    height: number,
    deactivate: boolean
  ): void

  closeApp(time: Time): void

  dataApp(time: Time, buffer: Uint8Array | ArrayBuffer): void
}

type CommandStateType = {
  time?: number
  scrollx?: number
  scrolly?: number
}

export class Container implements StrictSink {
  startPath(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    w: number,
    pressure: number
  ) {
    const tempbuffer = new ArrayBuffer(36)
    const dataview = new DataView(tempbuffer)

    // long header 16 Bytes
    switch (type) {
      case 1:
        // marker
        dataview.setUint8(0, 3) // major command type, marker line path is 3

        break
      case 2:
        // eraser
        dataview.setUint8(0, 4) // major command type, marker eraser path is 4

        break
      case 0:
      default:
        dataview.setUint8(0, 0) // major command type, normal line path is 0

        break
    }

    dataview.setUint16(1, 36) // length  1..2
    dataview.setUint8(3, curclient) // reserved 3;
    dataview.setUint32(4, objnum) // 4.. 7
    dataview.setFloat64(8, time) // 8..15
    this.lasttime[objnum] = time // store time for simple header
    // aux data

    dataview.setFloat32(16, x) // 16-19
    dataview.setFloat32(20, y) // 20-23
    dataview.setFloat32(24, w) // 24-27
    // console.log("FDC sP 0 w:",w);
    dataview.setUint32(28, color) // 28-31
    let intpress = 0.5
    if (pressure) intpress = pressure
    dataview.setFloat32(32, intpress) // 32-35

    this.pushArrayToStorage(tempbuffer)
  }

  addToPath(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    pressure: number
  ) {
    // todo add objnum
    const tempbuffer = new ArrayBuffer(24)
    const dataview = new DataView(tempbuffer)

    // short header 8 Bytes
    dataview.setUint8(0, 1) // major command type, add to line path is 1
    dataview.setUint16(1, 24) // length  1..2
    dataview.setUint8(3, curclient) // reserved 3;
    dataview.setUint32(4, objnum) // 4.. 7
    if (objnum in this.lasttime) {
      dataview.setFloat32(8, time - this.lasttime[objnum]) // 8..11
    } else {
      dataview.setFloat32(8, 0) // 8..11
    }

    this.lasttime[objnum] = time // store time for simple header

    dataview.setFloat32(12, x) // 12-15
    dataview.setFloat32(16, y) // 16-19
    let intpress = 0.5
    if (pressure) intpress = pressure
    dataview.setFloat32(20, intpress) // 20-23

    this.pushArrayToStorage(tempbuffer)
  }

  finishPath(time: Time, objnum: number, curclient: ClientNum) {
    const tempbuffer = new ArrayBuffer(12)
    const dataview = new DataView(tempbuffer)

    // short header 8 Bytes
    dataview.setUint8(0, 2) // major command type, close line path is 2
    dataview.setUint16(1, 12) // length  1..2
    dataview.setUint8(3, curclient) // reserved 3;
    dataview.setUint32(4, objnum) // 4.. 7
    if (objnum in this.lasttime) {
      dataview.setFloat32(8, time - this.lasttime[objnum]) // 8..11
    } else {
      dataview.setFloat32(8, 0) // 8..11
    }

    // this.lasttime=time; // store time for simple header
    delete this.lasttime[objnum]

    this.pushArrayToStorage(tempbuffer)
  }

  scrollBoard(time: Time, _clientnum: ClientType, x: number, y: number) {
    // clientnum is ignored, only relevant for live scrolling
    const tempbuffer = new ArrayBuffer(32) // actually it is a waste, but may be we need it later
    const dataview = new DataView(tempbuffer)

    dataview.setUint8(0, 5) // major command type, scroll board

    dataview.setUint16(1, 32) // length  1..2
    dataview.setUint8(3, 0) // reserved for future use 3
    dataview.setFloat64(4, time) // 4..11
    dataview.setFloat32(12, x) // 12-15 //absolute position
    dataview.setFloat32(16, y) // 16-19

    this.pushArrayToStorage(tempbuffer)
  }

  addPicture(
    time: Time,
    objnum: number,
    _curclient: ClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    id: string
  ) {
    // ok id was before a uuid, now it is general a hex coded id
    const buflength = id.length / 2 // it is hex coded so two bytes per byte
    if (buflength > 255) {
      console.log('id too long!', id, buflength)
      return
    }

    const destlength = 32 + 1 + buflength

    const tempbuffer = new ArrayBuffer(destlength)
    const dataview = new DataView(tempbuffer)
    // console.log("addPicture in failsdata Container");
    dataview.setUint8(0, 6) // major command type, addpicture

    dataview.setUint16(1, destlength) // length  1..2
    dataview.setUint8(3, 0) // reserved for future use 3
    dataview.setUint32(4, objnum) // 4.. 7
    dataview.setFloat64(8, time) // 8..15
    dataview.setFloat32(16, x) // 16-19 //absolute position
    dataview.setFloat32(20, y) // 20-23
    dataview.setFloat32(24, width) // 24-27 //width and height
    dataview.setFloat32(28, height) // 28-31

    dataview.setUint8(32, buflength) // 32

    // convert uuid to bytes

    let dest = 33 // 33- +
    for (let i = 0; i < id.length; i += 2) {
      if (dest >= destlength) break
      dataview.setUint8(dest, parseInt(id.substr(i, 2), 16))
      dest++
    }

    this.pushArrayToStorage(tempbuffer)
  }

  addForm(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: ColorType,
    fColor: ColorType,
    lw: number
  ) {
    const tempbuffer = new ArrayBuffer(45)
    const dataview = new DataView(tempbuffer)

    // long header 16 Bytes
    dataview.setUint8(0, 9) // major command type, forms is 9

    dataview.setUint16(1, 45) // length  1..2
    dataview.setUint8(3, curclient) // reserved 3;
    dataview.setUint32(4, objnum) // 4.. 7
    dataview.setFloat64(8, time) // 8..15
    this.lasttime[objnum] = time // store time for simple header
    // aux data

    dataview.setFloat32(16, x) // 16-19
    dataview.setFloat32(20, y) // 20-23
    dataview.setFloat32(24, width) // 24-27
    dataview.setFloat32(28, height) // 28-31

    // console.log("FDC sP 0 w:",w);
    dataview.setUint32(32, bColor) // 32-35
    dataview.setUint32(36, fColor) // 36-39
    dataview.setFloat32(40, lw) // 40-43
    switch (type) {
      case 1: // line
      case 2: // rectangle
      case 3: // circle
      case 4: // ellipse
        dataview.setUint8(44, type) // 44
        break
      default:
        dataview.setUint8(44, 1) // 44
        break
    }

    this.pushArrayToStorage(tempbuffer)
  }

  deleteObject(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    _storagenum: DrawContainerId
  ) {
    const tempbuffer = new ArrayBuffer(16)
    const dataview = new DataView(tempbuffer)

    // short header 8 Bytes
    dataview.setUint8(0, 7) // major command type, delete object is  7
    dataview.setUint16(1, 16) // length  1..2
    dataview.setUint8(3, curclient) // reserved 3;
    dataview.setUint32(4, objnum) // 4.. 7
    dataview.setFloat64(8, time) // 8..15

    this.pushArrayToStorage(tempbuffer)
  }

  moveObject(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number
  ) {
    const tempbuffer = new ArrayBuffer(24)
    const dataview = new DataView(tempbuffer)

    // short header 8 Bytes
    dataview.setUint8(0, 8) // major command type, move object is 8
    dataview.setUint16(1, 24) // length  1..2
    dataview.setUint8(3, curclient) // reserved 3;
    dataview.setUint32(4, objnum) // 4.. 7
    dataview.setFloat64(8, time) // 8..15

    dataview.setFloat32(16, x) // 16-19
    dataview.setFloat32(20, y) // 20-23

    this.pushArrayToStorage(tempbuffer)
  }

  startApp(
    time: Time,
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    sha: string,
    appid: string
  ) {
    if (typeof id !== 'string') return
    if (typeof sha !== 'string') return
    if (typeof appid !== 'string') return

    const buflength = sha.length / 2 // it is hex coded so two bytes per byte
    if (buflength !== 32) {
      console.log('sha not equal 256 bits!', sha, buflength)
      return
    }
    if (appid.length !== 36) {
      console.log('appid not equal to 36 char string ', appid)
      return
    }
    try {
      const tempbuffer = new ArrayBuffer(84)
      const dataview = new DataView(tempbuffer)

      dataview.setUint8(0, 10) // major command type, startApp is 10

      dataview.setUint16(1, 84) // length  1..2
      dataview.setUint8(3, 0) // reserved 3
      dataview.setFloat64(4, time) // 4..11
      // positioning
      dataview.setFloat32(12, x) // 12-15
      dataview.setFloat32(16, y) // 16-19
      dataview.setFloat32(20, width) // 20-23
      dataview.setFloat32(24, height) // 24-27
      let id64 = 0n
      // We start with the id, it is 36 coded and 9 tokens long, which means max 6 bytes
      for (const num of id) {
        id64 = id64 * 36n + BigInt(parseInt(num, 36))
      }
      dataview.setBigUint64(28, id64) // 28-35
      // now the sha
      let dest = 36 // 36-67
      for (let i = 0; i < 32 * 2; i += 2) {
        dataview.setUint8(dest, parseInt(sha.substr(i, 2), 16))
        dest++
      }
      // parse uuid
      dest = 68 // 68-83
      for (let i = 0; i < 36; i += 2) {
        if (appid.substr(i, 1) === '-') i++
        dataview.setUint8(dest, parseInt(appid.substr(i, 2), 16))
        dest++
      }
      this.pushArrayToStorage(tempbuffer)
    } catch (error) {
      // TODO later fall silently
      console.log('startApp problem', error)
    }
  }

  closeApp(time: Time) {
    const tempbuffer = new ArrayBuffer(12)
    const dataview = new DataView(tempbuffer)
    dataview.setUint8(0, 11) // major command type, closeApp is 11
    dataview.setUint16(1, 12) // length  1..2
    dataview.setUint8(3, 0) // reserved 3
    dataview.setFloat64(4, time) // 4..11
    this.pushArrayToStorage(tempbuffer)
  }

  dataApp(time: Time, buffer: Uint8Array | ArrayBuffer) {
    // this one is tricky
    const ab = buffer instanceof ArrayBuffer ? buffer : buffer.buffer
    if (!ab) return
    // header length is 8 bytes for the start, and 4 bytes for continuation
    const length = ab.byteLength
    let chunks = 1
    let dvlength = 0
    if (length >= 0xffff - 8) {
      dvlength += 0xffff
      const addchunks = Math.ceil((length - 0xffff + 8) / (0xffff - 4))
      const lastchunklen = (length - 0xffff + 8) % (0xffff - 4)
      dvlength += (addchunks - 1) * 0xffff
      dvlength += lastchunklen + 4
      chunks += addchunks
    } else {
      dvlength = 8 + length
    }
    const tempbuffer = new ArrayBuffer(dvlength)
    const dataview = new DataView(tempbuffer)
    const arrayview = new Uint8Array(tempbuffer)
    let pos = 0
    let remainlength = length
    let bufferpos = 0
    for (let chunk = 0; chunk < chunks; chunk++) {
      const headersize = chunk === 0 ? 8 : 4
      const payloadsize = Math.min(0xffff - headersize, remainlength)
      dataview.setUint8(pos + 0, 12) // major command type, dataApp is 12
      dataview.setUint16(pos + 1, Math.min(0xffff, payloadsize + headersize)) // length  1..2
      dataview.setUint8(
        pos + 3,
        chunk === 0 ? 1 /* default coding */ : 0 /* continue */
      ) // coding 3
      // if coding is
      // 0 continuation
      // 1 start with default coding
      if (chunk === 0) dataview.setFloat64(pos + 4, time) // 4..11
      pos += headersize
      const ua = new Uint8Array(ab, bufferpos, payloadsize)
      arrayview.set(ua, pos)
      pos += headersize
      remainlength -= payloadsize
      bufferpos += payloadsize
    }
    this.pushArrayToStorage(tempbuffer)
  }

  moveApp(
    time: Time,
    x: number,
    y: number,
    width: number,
    height: number,
    deactivate: boolean
  ) {
    const tempbuffer = new ArrayBuffer(28)
    const dataview = new DataView(tempbuffer)

    dataview.setUint8(0, 13) // major command type, moveApp is 13

    dataview.setUint16(1, 28) // length  1..2
    dataview.setUint8(3, deactivate ? 0x1 : 0) // reserved 3
    dataview.setFloat64(4, time) // 4..11
    // positioning
    dataview.setFloat32(12, x) // 12-15
    dataview.setFloat32(16, y) // 16-19
    dataview.setFloat32(20, width) // 20-23
    dataview.setFloat32(24, height) // 24-27

    this.pushArrayToStorage(tempbuffer)
  }

  pushArrayToStorage(data: ArrayBuffer) {
    throw new Error('pushArrayToStorage is not implemented')
  }

  protected lasttime: { [key: number]: number } = {}
}

export class MemContainer extends Container {
  constructor(id: DrawContainerId, _dummy: any) {
    super()
    this.id_ = id
  }

  getContainerData() {
    const clonestorage = new ArrayBuffer(this.storageSize)
    new Uint8Array(clonestorage).set(
      new Uint8Array(this.storage, 0, this.storageSize)
    ) // copy data
    return clonestorage
  }

  pushArrayToStorage(array: ArrayBuffer) {
    while (array.byteLength + this.storageSize > this.storageAllocSize) {
      // realloc data
      this.storageAllocSize *= 2
      const reallocstorage = new ArrayBuffer(this.storageAllocSize)
      new Uint8Array(reallocstorage).set(new Uint8Array(this.storage))
      this.storage = reallocstorage
    }
    new Uint8Array(this.storage).set(new Uint8Array(array), this.storageSize)
    // console.log("pATS",this.storageSize,array.byteLength,this);
    this.storageSize += array.byteLength
  }

  replaceStoredData(data: ArrayBuffer) {
    if (data.byteLength > this.storageAllocSize) {
      this.storageAllocSize = data.byteLength + 6400
      this.storage = new ArrayBuffer(this.storageAllocSize)
    }
    this.storageSize = data.byteLength
    /* console.log(
      'replaceStorage data bl',
      data,
      data.byteLength,
      this.storageSize,
      this
    ) */
    new Uint8Array(this.storage).set(new Uint8Array(data)) // copy data
  }

  getElementTime(position: DrawContainerId, lasttime: number) {
    if (position + 8 > this.storageSize) return 0 // should never happen
    const dataview = new DataView(this.storage)
    const command = dataview.getUint8(position)
    let time = lasttime
    switch (command) {
      case 3:
      case 4:
      case 0:
        if (position + 16 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 8)

        break
      case 1:
      case 2:
        if (position + 8 > this.storageSize) return 0 // should never happen
        time += dataview.getFloat32(position + 4)

        break
      case 5:
        if (position + 20 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 4)

        break
      case 6:
        if (position + 48 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 8)

        break
      case 7:
        if (position + 16 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 8)
        break
      case 8:
        if (position + 24 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 8)
        break
      case 9:
        if (position + 45 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 8)
        break
      case 10:
        if (position + 84 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 4)
        break
      case 11:
        if (position + 12 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 4)
        break
      case 12:
        {
          // Note we only ensure header sizes here, not payload
          const type = dataview.getUint8(position + 3)
          if (type !== 0) {
            // no continuation
            if (position + 8 > this.storageSize) return 0 // should never happen
            time = dataview.getFloat64(position + 4)
          } else {
            if (position + 4 > this.storageSize) return 0 // should never happen
          }
        }
        break
      case 13:
        if (position + 28 > this.storageSize) return 0 // should never happen
        time = dataview.getFloat64(position + 4)
        break
    }
    return time
  }

  getElementObjnum(position: number, lastobjnum: number) {
    if (position + 8 > this.storageSize) return 0 // should never happen
    const dataview = new DataView(this.storage)
    const command = dataview.getUint8(position)
    let objnum = lastobjnum
    switch (command) {
      case 3:
      case 4:
      case 0:
      case 7:
        if (position + 16 > this.storageSize) return 0 // should never happen
        objnum = dataview.getUint32(position + 4)

        break
      case 1:
      case 8:
        if (position + 24 > this.storageSize) return 0 // should never happen
        objnum = dataview.getUint32(position + 4)

        break
      case 2:
        if (position + 12 > this.storageSize) return 0 // should never happen
        objnum = dataview.getUint32(position + 4)

        break
      case 5:
        if (position + 20 > this.storageSize) return 0 // should never happen

        break
      case 6:
        if (position + 48 > this.storageSize) return 0 // should never happen
        objnum = dataview.getUint32(position + 4)

        break
      case 9:
        if (position + 45 > this.storageSize) return 0 // should never happen
        objnum = dataview.getUint32(position + 4)
        break
      case 10:
        if (position + 84 > this.storageSize) return 0 // should never happen
        break
      case 11:
        if (position + 12 > this.storageSize) return 0 // should never happen
        break
      case 12:
        {
          // Note we only ensure header sizes here, not payload
          const type = dataview.getUint8(position + 3)
          if (type !== 0) {
            // no continuation
            if (position + 8 > this.storageSize) return 0 // should never happen
          } else {
            if (position + 4 > this.storageSize) return 0 // should never happen
          }
        }
        break
      case 13:
        if (position + 28 > this.storageSize) return 0 // should never happen
        break
    }
    return objnum
  }

  redrawElementTo(datasink: Sink, pos: number, lasttime: number) {
    // First Check size
    const dataview = new DataView(this.storage)
    if (2 + pos > this.storageSize) {
      // console.log("pos+2test",pos,this.storageSize);
      return -1 // this was the last element
    }
    const command = dataview.getUint8(pos)
    const length = dataview.getUint16(pos + 1)
    if (length + pos > this.storageSize) {
      // console.log("pos+lengthtest",pos,length,this.storageSize,command);
      return -1 // this was the last element
    }
    // console.log("rdE",length,pos,command,this.storageSize);

    switch (command) {
      case 3:
      case 4:
      case 0:
        {
          // now replay the data
          if (length < 32) {
            // console.log("damaged data1",length,pos);
            return -1 // damaged data
          }
          let type = 0
          if (command === 3) type = 1
          else if (command === 4) type = 2
          // console.log("rdE 0 w:",dataview.getFloat32(pos+24));
          // console.log("startpath length", length);
          datasink.startPath(
            dataview.getFloat64(pos + 8),
            dataview.getUint32(pos + 4),
            dataview.getUint8(pos + 3),
            dataview.getFloat32(pos + 16),
            dataview.getFloat32(pos + 20),
            type,
            dataview.getUint32(pos + 28),
            dataview.getFloat32(pos + 24),
            length < 36 ? 0.5 : dataview.getFloat32(pos + 32)
          )
        }
        break
      case 1:
        if (length < 20) return -1 // damaged data

        // console.log("addtoPath length", length);
        datasink.addToPath(
          lasttime + dataview.getFloat32(pos + 8),
          dataview.getUint32(pos + 4),
          dataview.getUint8(pos + 3),
          dataview.getFloat32(pos + 12),
          dataview.getFloat32(pos + 16),
          length < 24 ? 0.5 : dataview.getFloat32(pos + 20)
        )
        break
      case 2:
        if (length < 12) {
          // console.log("damaged data3");
          return -1 // damaged data
        }
        datasink.finishPath(
          lasttime + dataview.getFloat32(pos + 8),
          dataview.getUint32(pos + 4),
          dataview.getUint8(pos + 3)
        )

        break
      case 6:
        {
          //  console.log("addPicture in failsdata redraw");
          const idlength = dataview.getUint8(pos + 32)
          let nid = ''
          if (length < idlength + 1 + 32) {
            return -1 // damaged data
          }
          for (let i = 0; i < idlength; i++) {
            const number = dataview.getUint8(pos + 32 + 1 + i)
            let str = number.toString(16)
            if (str.length === 1) str = '0' + str
            nid += str
          }

          datasink.addPicture(
            dataview.getFloat64(pos + 8),
            dataview.getUint32(pos + 4),
            dataview.getUint8(pos + 3),
            dataview.getFloat32(pos + 16),
            dataview.getFloat32(pos + 20),
            dataview.getFloat32(pos + 24),
            dataview.getFloat32(pos + 28),
            nid
          )
        }
        break
      case 7:
        // now replay the data
        if (length < 16) {
          return -1 // damaged data
        }
        datasink.deleteObject(
          dataview.getFloat64(pos + 8),
          dataview.getUint32(pos + 4),
          dataview.getUint8(pos + 3),
          null
        )

        break
      case 8:
        // now replay the data
        if (length < 24) {
          return -1 // damaged data
        }
        datasink.moveObject(
          dataview.getFloat64(pos + 8),
          dataview.getUint32(pos + 4),
          dataview.getUint8(pos + 3),
          dataview.getFloat32(pos + 16),
          dataview.getFloat32(pos + 20)
        )

        break
      case 9:
        // now replay the data
        if (length < 45) {
          // console.log("damaged data1",length,pos);
          return -1 // damaged data
        }
        // console.log("rdE 0 w:",dataview.getFloat32(pos+24));
        // console.log("startpath length", length);
        datasink.addForm(
          dataview.getFloat64(pos + 8),
          dataview.getUint32(pos + 4),
          dataview.getUint8(pos + 3),
          dataview.getFloat32(pos + 16),
          dataview.getFloat32(pos + 20),
          dataview.getFloat32(pos + 24),
          dataview.getFloat32(pos + 28),
          dataview.getUint8(pos + 44),
          dataview.getUint32(pos + 32),
          dataview.getUint32(pos + 36),
          dataview.getFloat32(pos + 40)
        )

        break
    }

    return pos + length
  }

  reparseCommand(pos: DrawContainerId, commandstate: CommandStateType) {
    // First Check size
    const dataview = new DataView(this.storage)
    if (2 + pos > this.storageSize) {
      // console.log("pos+2test",pos,this.storageSize, this);
      return -1 // this was the last element
    }
    const command = dataview.getUint8(pos)
    const length = dataview.getUint16(pos + 1)
    if (length + pos > this.storageSize) {
      // console.log("pos+lengthtest",pos,length,this.storageSize,command);
      return -1 // this was the last element
    }
    // console.log("rdE",length,pos,command,this.storageSize);

    switch (command) {
      case 5:
        // now replay the data
        if (length < 12) {
          // console.log("damaged data1",length,pos);
          return -1 // damaged data
        }

        commandstate.time = dataview.getFloat64(pos + 4)
        commandstate.scrollx = dataview.getFloat32(pos + 12)
        commandstate.scrolly = dataview.getFloat32(pos + 16)

        break
    }

    return pos + length
  }

  getCurCommandState() {
    let contpos = 0
    const commandstate = {}
    while (contpos >= 0) {
      contpos = this.reparseCommand(contpos, commandstate)
      // console.log("contpos",contpos);
    }
    return commandstate
  }

  reparseJupyter(datasink: Sink, pos: number) {
    // First Check size
    const dataview = new DataView(this.storage)
    if (2 + pos > this.storageSize) {
      // console.log("pos+2test",pos,this.storageSize, this);
      return -1 // this was the last element
    }
    const command = dataview.getUint8(pos)
    const length = dataview.getUint16(pos + 1)
    if (length + pos > this.storageSize) {
      // console.log("pos+lengthtest",pos,length,this.storageSize,command);
      return -1 // this was the last element
    }
    // console.log("rdE",length,pos,command,this.storageSize);

    switch (command) {
      case 10:
        {
          // now replay the data
          if (length < 84) {
            // console.log("damaged data1",length,pos);
            return -1 // damaged data
          }
          const id64 = dataview.getBigUint64(pos + 28) // 28-35
          const id = id64.toString(36).padStart(9, '0')
          // ok read sha
          let sha = ''
          let src = 36 // 36-67
          for (let i = 0; i < 32 * 2; i += 2) {
            const number = dataview.getUint8(pos + src)
            sha += number.toString(16).padStart(2, '0')
            src++
          }
          // now the uuid
          src = 68 // 68-83
          let appid = ''
          for (let i = 0; i < 32; i += 2) {
            const number = dataview.getUint8(pos + src)
            appid += number.toString(16).padStart(2, '0')
            if (i === 6 || i === 10 || i === 14 || i === 18) appid += '-'
            src++
          }
          datasink.startApp(
            dataview.getFloat64(pos + 4), // 4..11 time
            dataview.getFloat32(pos + 12), // 12-15 x
            dataview.getFloat32(pos + 16), // 16-19 y
            dataview.getFloat32(pos + 20), // 20-23 width
            dataview.getFloat32(pos + 24), // 24-27 height
            id,
            sha,
            appid
          )
        }
        break
      case 11:
        // now replay the data
        if (length < 12) {
          // console.log("damaged data1",length,pos);
          return -1 // damaged data
        }
        datasink.closeApp(dataview.getFloat64(pos + 4))
        break
      case 12:
        {
          // this one is tricky, we need all frames in order to proceed
          let payloadsize = 0
          // sizescan
          let scanpos = 0
          let time
          while (true) {
            if (length < 4 + scanpos) {
              return -1 // damaged data
            }
            const size = dataview.getUint16(pos + scanpos + +1)
            const type = dataview.getUint8(pos + scanpos + 3)
            if (scanpos > 0 && type !== 0 /* not continuation */) return -1 // damaged data
            if (length < scanpos + size) {
              return -1 // damaged data
            }
            if (type > 0) {
              time = dataview.getFloat64(pos + scanpos + 4)
            }
            const headerlength = type !== 0 ? 8 : 4
            payloadsize += size - headerlength
            if (size !== 0xffff) break
            scanpos += size
          }
          const data = new Uint8Array(payloadsize)
          let copypos = 0
          scanpos = 0
          while (copypos !== payloadsize) {
            const size = dataview.getUint16(pos + scanpos + +1)
            const type = dataview.getUint8(pos + scanpos + 3)
            const headerlength = type !== 0 ? 8 : 4
            const payloadlen = size - headerlength
            const srcArray = new Uint8Array(
              dataview.buffer,
              pos + scanpos + headerlength,
              payloadlen
            )
            data.set(srcArray, copypos)
            copypos += payloadlen
            scanpos += size
          }
          datasink.dataApp(time, data)
        }
        break
      case 13:
        {
          // now replay the data
          if (length < 28) {
            // console.log("damaged data1",length,pos);
            return -1 // damaged data
          }
          const properties = dataview.getInt8(pos + 3)
          datasink.moveApp(
            dataview.getFloat64(pos + 4), // 4..11 time
            dataview.getFloat32(pos + 12), // 12-15 x
            dataview.getFloat32(pos + 16), // 16-19 y
            dataview.getFloat32(pos + 20), // 20-23 width
            dataview.getFloat32(pos + 24), // 24-27 height
            !!(properties & 0x1)
          )
        }
        break
    }

    return pos + length
  }

  protected storage: ArrayBuffer = new ArrayBuffer(6400)
  protected storageAllocSize: number = 6400
  protected storageSize: number = 0
  protected id_: DrawContainerId
}

type CallbackContainerConfig = {
  obj: {}
  writeData: ContainerWriteData
}

export type ContainerWriteData = (
  obj: {},
  id: ContainerId,
  data: ArrayBuffer,
  append: boolean
) => void

export class CallbackContainer extends Container {
  constructor(num: ContainerId, config: CallbackContainerConfig) {
    super()
    this.writeData = config.writeData
    this.obj = config.obj
    this.number = num
  }

  pushArrayToStorage(array: ArrayBuffer) {
    this.writeData(this.obj, this.number, array, true)
  }

  replaceStoredData(data: ArrayBuffer) {
    this.writeData(this.obj, this.number, data, false)
  }

  protected writeData: ContainerWriteData
  protected obj: {}
  protected number: ContainerId
}

type CollectionContainerConfig = {
  obj: {}
  writeData: ContainerWriteData
}

type CollectionContainerType = (
  id: ContainerId,
  config: CollectionContainerConfig
) => Container

export class Collection implements StrictSink {
  constructor(
    containertype: CollectionContainerType,
    containerconfig: CollectionContainerConfig
  ) {
    this.containertype_ = containertype
    this.containerconfig_ = containerconfig
    this.commandcontainer_ = this.containertype_('command', containerconfig)
    this.jupytercontainer_ = this.containertype_('jupyter', containerconfig)
  }

  setOnDirty(cb: (dirty: boolean) => void) {
    this.ondirty_ = cb
    this.ondirty_(this.dirty)
  }

  ondirty(dirty: boolean): void {
    if (this.ondirty_) {
      this.ondirty_(dirty)
    }
  }

  unDirty(cont: number) {
    this.contdirty_[cont] = false
    if (!this.contdirty_.some((el) => !!el)) {
      this.dirty = false
    }
  }

  checkContainerExistsAndDirty(storagenum: DrawContainerId) {
    if (!(storagenum in this.containers_)) {
      // TODO for the network case sync with server
      this.containers_[storagenum] = this.containertype_(
        storagenum,
        this.containerconfig_
      )
    }
    if (!this.contdirty_[storagenum]) {
      this.contdirty_[storagenum] = true
      this.dirty = true
    }
  }

  startPath(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    w: number,
    pressure: number
  ) {
    const storagenum = Math.floor(y) // in Normalized coordinates we have rectangular areas
    // console.log("strnm SP",storagenum);
    this.checkContainerExistsAndDirty(storagenum)
    this.lastcontainer[objnum] = storagenum

    this.containers_[storagenum].startPath(
      time,
      objnum,
      curclient,
      x,
      y,
      type,
      color,
      w,
      pressure
    )
  }

  addToPath(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    pressure: number
  ) {
    if (!(objnum in this.lastcontainer)) {
      this.lastcontainer[objnum] = Math.floor(y) // may be not optimal, but better than nothing
    }
    const storagenum = this.lastcontainer[objnum] // in Normalized coordinates we have rectangular areas
    // console.log("strnm atp",storagenum);
    if (typeof storagenum !== 'number')
      throw new Error('Wrong Type of storage number')
    this.checkContainerExistsAndDirty(storagenum)

    this.containers_[storagenum].addToPath(
      time,
      objnum,
      curclient,
      x,
      y,
      pressure
    )
  }

  finishPath(time: Time, objnum: number, curclient: ClientNum) {
    if (!(objnum in this.lastcontainer)) {
      // we have to skip it, no guess possible
      return
    }
    const storagenum = this.lastcontainer[objnum] // in Normalized coordinates we have rectangular areas
    // console.log("strnm fp",storagenum);
    if (typeof storagenum !== 'number')
      throw new Error('Wrong Type of storage number')
    this.checkContainerExistsAndDirty(storagenum)
    delete this.lastcontainer[objnum]

    this.containers_[storagenum].finishPath(time, objnum, curclient)
  }

  addPicture(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    uuid: string
  ) {
    const storagenum = Math.floor(y) // in Normalized coordinates we have rectangular areas
    this.checkContainerExistsAndDirty(storagenum)
    // console.log("addPicture in failsdata collection",storagenum);

    this.containers_[storagenum].addPicture(
      time,
      objnum,
      curclient,
      x,
      y,
      width,
      height,
      uuid
    )
  }

  addForm(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: ColorType,
    fColor: ColorType,
    lw: number
  ) {
    const storagenum = Math.floor(y) // in Normalized coordinates we have rectangular areas
    this.checkContainerExistsAndDirty(storagenum)

    this.containers_[storagenum].addForm(
      time,
      objnum,
      curclient,
      x,
      y,
      width,
      height,
      type,
      bColor,
      fColor,
      lw
    )
  }

  deleteObject(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    storagenum: DrawContainerId
  ) {
    if (!Number.isInteger(storagenum)) return
    this.checkContainerExistsAndDirty(storagenum)
    this.containers_[storagenum].deleteObject(
      time,
      objnum,
      curclient,
      storagenum
    )
  }

  moveObject(
    time: Time,
    objnum: number,
    curclient: ClientNum,
    x: number,
    y: number
  ) {
    const storagenum = Math.floor(y) // in Normalized coordinates we have rectangular areas
    this.checkContainerExistsAndDirty(storagenum)
    this.containers_[storagenum].moveObject(time, objnum, curclient, x, y)
  }

  scrollBoard(time: Time, clientnum: ClientType, x: number, y: number) {
    this.commandcontainer_.scrollBoard(time, clientnum, x, y)
  }

  startApp(
    time: Time,
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    sha: string,
    appid: string
  ) {
    this.jupytercontainer_.startApp(time, x, y, width, height, id, sha, appid)
  }

  closeApp(time: Time) {
    this.jupytercontainer_.closeApp(time)
  }

  dataApp(time: Time, buffer: ArrayBuffer) {
    this.jupytercontainer_.dataApp(time, buffer)
  }

  moveApp(
    time: Time,
    x: number,
    y: number,
    width: number,
    height: number,
    deactivate: boolean
  ) {
    this.jupytercontainer_.moveApp(time, x, y, width, height, deactivate)
  }

  clearContainers() {
    this.containers_ = []
    this.contdirty_ = []
    this.dirty = false
    if (this.ondirty) this.ondirty(false)

    this.lastcontainer = {}
    this.commandcontainer_ = this.containertype_(
      'command',
      this.containerconfig_
    )
    this.jupytercontainer_ = this.containertype_(
      'jupyter',
      this.containerconfig_
    )
  }

  set dirty(ndirty: boolean) {
    if (this.dirty_ !== ndirty) {
      this.dirty_ = ndirty
      this.ondirty(ndirty)
    }
  }

  get dirty() {
    return this.dirty_
  }

  get commandcontainer() {
    return this.commandcontainer_
  }

  get jupytercontainer() {
    return this.jupytercontainer_
  }

  get containers() {
    return this.containers_
  }

  get contdirty() {
    return this.contdirty_
  }

  protected lastcontainer: {
    [key: number]: ContainerId
  } = {}
  protected containers_: Container[] = []
  protected contdirty_: boolean[] = []
  protected containerconfig_: CollectionContainerConfig
  protected containertype_: CollectionContainerType
  protected commandcontainer_: Container
  protected jupytercontainer_: Container

  protected dirty_: boolean = false
  protected ondirty_: ((dirty: boolean) => void) | undefined = undefined
}

type RedrawCollectionContainerType = (
  id: ContainerId,
  config: CollectionContainerConfig
) => MemContainer

export class RedrawCollection extends Collection {
  constructor(
    containertype: RedrawCollectionContainerType,
    containerconfig: CollectionContainerConfig
  ) {
    super(containertype, containerconfig)
  }

  suggestRedraw(
    minareadrawn: number,
    maxareadrawn: number,
    curpostop: number,
    curposbottom: number
  ) {
    // console.log("sugredraw",minareadrawn,maxareadrawn,curpostop,curposbottom);

    const minareadrawni = Math.floor(minareadrawn)
    const maxareadrawni = Math.floor(maxareadrawn)
    const curpostopi = Math.floor(curpostop)
    const curposbottomi = Math.floor(curposbottom)
    // console.log("sugredrawi",minareadrawni,maxareadrawni,curpostopi,curposbottomi);

    if (curpostopi - minareadrawni > 3) {
      return true
    } // make the drawn area smaller
    if (maxareadrawni - curposbottomi > 3) {
      return true
    } // make the drawn area smaller
    if (curpostopi - minareadrawni === 0 && curpostopi > 0) {
      return true
    }
    // First step determine covered area
    let storedmin = 0
    let storedmax = 0
    this.containers_.forEach(function (_obj, num) {
      storedmin = Math.min(storedmin, num)
      storedmax = Math.max(storedmax, num)
    })
    //    console.log("sugredrawt4",storedmin,storedmax);
    if (maxareadrawni - curposbottomi === 0 && curposbottomi < storedmax) {
      // console.log('sg4')
      return true
    }
    //    console.log("sugredrawt5");
    return false
  }
  // var redrawcount=0;

  redrawTo(datasink: Sink, mindraw: number, maxdraw: number) {
    const contit = []
    const contpos = []
    const conttime = []
    const contobjnum = []

    let istart = 0
    let iend = this.containers_.length

    if (mindraw) istart = Math.floor(mindraw)
    if (maxdraw) iend = Math.ceil(maxdraw)
    if (istart < 0) istart = 0

    // console.log("Redraw from to",istart,iend,redrawcount); redrawcount++;
    console.log('Dataavail from to', 0, this.containers_.length)
    // istart=0;
    // iend=this.containers_.length;

    for (let i = istart; i !== iend; i++) {
      if (this.containers_[i] === undefined) continue
      contit.push(this.containers_[i])
      contpos.push(0)
      conttime.push(this.containers_[i].getElementTime(0, 0))
      contobjnum.push(this.containers_[i].getElementObjnum(0, 0))
    }
    while (contit.length) {
      let targettime = 0
      let target = -1
      for (let i = 0; i < contit.length; i++) {
        // console.log("av",contobjnum[i],conttime[i]);
        if (i === 0 || targettime > conttime[i]) {
          targettime = conttime[i]
          target = i
        }
      }

      if (target === -1) break // nothing found weird
      contpos[target] = contit[target].redrawElementTo(
        datasink,
        contpos[target],
        conttime[target]
      )
      // console.log("targettime",targettime: number, targetobjnum);
      if (contpos[target] < 0) {
        // remove from array
        contpos.splice(target, 1)
        contit.splice(target, 1)
        conttime.splice(target, 1)
        contobjnum.splice(target, 1)
      } else {
        conttime[target] = contit[target].getElementTime(
          contpos[target],
          conttime[target]
        )
        contobjnum[target] = contit[target].getElementObjnum(
          contpos[target],
          contobjnum[target]
        )
      }
    }
  }

  reparseJupyter(datasink: Sink) {
    let pos = 0
    while (pos >= 0) {
      pos = this.jupytercontainer_.reparseJupyter(datasink, pos)
    }
  }

  replaceStoredData(i: ContainerId, data: ArrayBuffer) {
    if (i === 'command') {
      this.commandcontainer_.replaceStoredData(data)
    } else if (i === 'jupyter') {
      this.jupytercontainer_.replaceStoredData(data)
    } else {
      if (!(i in this.containers_)) {
        this.containers_[i] = this.containertype_(i, this.containerconfig_)
      }
      this.contdirty_[i] = false
      this.containers_[i].replaceStoredData(data)
      if (this.contdirty_.some((el) => !!el)) {
        if (!this.dirty) {
          this.dirty = true
          this.ondirty(true)
        }
      } else {
        if (this.dirty) {
          this.dirty = false
          this.ondirty(false)
        }
      }
    }
  }
  declare protected containers_: MemContainer[]
  declare protected jupytercontainer_: MemContainer
  declare protected commandcontainer_: MemContainer
  declare protected containertype_: RedrawCollectionContainerType
}

type DisTimeType<T> = T extends Sink ? OptTime : Time
type DisClientNum<T> = T extends Sink ? OptClientNum : ClientNum

export class Dispatcher<SinkType extends Sink | StrictSink> {
  getTime() {
    return now() - this.starttime
  }

  addSink(sink: SinkType) {
    this.datasinklist.add(sink)
  }

  removeSink(sink: SinkType) {
    this.datasinklist.delete(sink)
  }

  startPath(
    time: DisTimeType<SinkType>,
    objnum: number,
    curclient: DisClientNum<SinkType>,
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    w: number,
    pressure: number
  ) {
    if (this.blocked) return
    const object = objnum

    let timeset = time
    if (!timeset) timeset = now() - this.starttime

    let client = curclient
    if (!client) client = this.curclientnum
    this.datasinklist.forEach((sink) =>
      sink.startPath(timeset, object, client, x, y, type, color, w, pressure)
    )
  }

  addToPath(
    time: DisTimeType<SinkType>,
    objnum: number,
    curclient: DisClientNum<SinkType>,
    x: number,
    y: number,
    pressure: number
  ) {
    // console.log("FDD aTP",this);
    if (this.blocked) return
    let client = curclient ?? this.curclientnum
    let timeset = time
    if (!timeset) timeset = now() - this.starttime

    this.datasinklist.forEach((sink) =>
      sink.addToPath(timeset, objnum, client, x, y, pressure)
    )
  }

  finishPath(
    time: DisTimeType<SinkType>,
    objnum: number,
    curclient: DisClientNum<SinkType>
  ) {
    // console.log("FDD fP",this);
    if (this.blocked) return
    let client = curclient ?? this.curclientnum
    let timeset = time
    if (!timeset) timeset = now() - this.starttime

    this.datasinklist.forEach((sink) =>
      sink.finishPath(timeset, objnum, client)
    )
  }

  scrollBoard(
    time: DisTimeType<SinkType>,
    clientnum: ClientType,
    x: number,
    y: number
  ) {
    this.setTimeandScrollPos(time, x, y)
    let timeset = time
    if (!timeset) timeset = now() - this.starttime
    this.datasinklist.forEach((sink) =>
      sink.scrollBoard(timeset, clientnum, x, y)
    )
  }

  addPicture(
    time: DisTimeType<SinkType>,
    objnum: number,
    curclient: DisClientNum<SinkType>,
    x: number,
    y: number,
    width: number,
    height: number,
    uuid: string
  ) {
    // console.log("addPicture in failsdata dispatcher before blocked");
    if (this.blocked) return
    // var object=this.fixObjNumber(objnum);
    const object = objnum

    let timeset = time
    if (!timeset) timeset = now() - this.starttime

    let client = curclient
    if (!client) client = this.curclientnum
    // console.log("addPicture in failsdata dispatcher");

    this.datasinklist.forEach((sink) =>
      sink.addPicture(timeset, object, client, x, y, width, height, uuid)
    )
  }

  addForm(
    time: DisTimeType<SinkType>,
    objnum: number,
    curclient: DisClientNum<SinkType>,
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: number,
    fColor: number,
    lw: number
  ) {
    if (this.blocked) return
    const object = objnum

    let timeset = time
    if (!timeset) timeset = now() - this.starttime

    let client = curclient
    if (!client) client = this.curclientnum

    this.datasinklist.forEach((sink) =>
      sink.addForm(
        timeset,
        object,
        client,
        x,
        y,
        width,
        height,
        type,
        bColor,
        fColor,
        lw
      )
    )
  }

  deleteObject(
    time: DisTimeType<SinkType>,
    objnum: number,
    curclient: DisClientNum<SinkType>,
    storagenum: DrawContainerId
  ) {
    if (this.blocked) return
    let client = curclient ?? this.curclientnum
    let timeset = time
    if (!timeset) timeset = now() - this.starttime

    this.datasinklist.forEach((sink) =>
      sink.deleteObject(timeset, objnum, client, storagenum)
    )
  }

  moveObject(
    time: DisTimeType<SinkType>,
    objnum: number,
    curclient: DisClientNum<SinkType>,
    x: number,
    y: number
  ) {
    if (this.blocked) return
    let client = curclient ?? this.curclientnum
    let timeset = time
    if (!timeset) timeset = now() - this.starttime

    this.datasinklist.forEach((sink) =>
      sink.moveObject(timeset, objnum, client, x, y)
    )
  }

  startApp(
    time: DisTimeType<SinkType>,
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    sha: string,
    appid: string
  ) {
    if (this.blocked) return
    let timeset = time
    if (!timeset) timeset = now() - this.starttime
    this.datasinklist.forEach((sink) =>
      sink.startApp(timeset, x, y, width, height, id, sha, appid)
    )
  }

  closeApp(time: DisTimeType<SinkType>) {
    if (this.blocked) return
    let timeset = time
    if (!timeset) timeset = now() - this.starttime
    this.datasinklist.forEach((sink) => sink.closeApp(timeset))
  }

  dataApp(time: DisTimeType<SinkType>, buffer: ArrayBuffer | Uint8Array) {
    if (this.blocked) return
    let timeset = time
    if (!timeset) timeset = now() - this.starttime
    this.datasinklist.forEach((sink) => sink.dataApp(timeset, buffer))
  }

  moveApp(
    time: DisTimeType<SinkType>,
    x: number,
    y: number,
    width: number,
    height: number,
    deactivate: boolean
  ) {
    if (this.blocked) return
    let timeset = time
    if (!timeset) timeset = now() - this.starttime
    this.datasinklist.forEach((sink: SinkType) =>
      sink.moveApp(timeset, x, y, width, height, deactivate)
    )
  }

  setTimeandScrollPos(
    time: DisTimeType<SinkType>,
    scrollx: number,
    scrolly: number
  ) {
    if (time) {
      // time= now()-starttime
      // console.log("timeadjusted now",now(),time);
      this.starttime = now() - time // adjusttime
      // console.log("timeadjusted",this.starttime: number, time);
    }
    if (scrollx) this.scrollx = scrollx
    if (scrolly) this.scrolly = scrolly
  }

  protected datasinklist = new Set<SinkType>()

  protected curclientnum = 0

  protected blocked = false

  protected scrollx = 0
  protected scrolly = 0

  protected starttime = now()
}

type NetStartPath = {
  task: 'startPath'
  time: OptTime
  objnum: number
  curclient: number
  x: number
  y: number
  type: ToolType
  color: ColorType
  w: number
  pressure: number
}

type NetAddToPath = {
  task: 'addToPath'
  time: OptTime
  objnum: number
  curclient: number
  x: number
  y: number
  pressure: number
}

type NetFinishPath = {
  task: 'finishPath'
  time: OptTime
  objnum: number
  curclient: number
}

type NetAddPicture = {
  task: 'addPicture'
  time: OptTime
  objnum: number
  curclient: number
  x: number
  y: number
  width: number
  height: number
  uuid: string
}

type NetAddForm = {
  task: 'addForm'
  time: OptTime
  objnum: number
  curclient: number
  x: number
  y: number
  w: number
  h: number
  type: FormType
  bColor: ColorType
  fColor: ColorType
  lw: number
}

type NetScrollBoard = {
  task: 'scrollBoard'
  time: OptTime
  clientnum: ClientType
  x: number
  y: number
}

type NetDeleteObject = {
  task: 'deleteObject'
  time: OptTime
  objnum: number
  clientnum: number
  storagenum: DrawContainerId
}

type NetMoveObject = {
  task: 'moveObject'
  time: OptTime
  objnum: number
  clientnum: number
  x: number
  y: number
}

type NetStartApp = {
  task: 'startApp'
  time: OptTime
  x: number
  y: number
  width: number
  height: number
  id: string
  sha: string
  appid: string
}

type NetCloseApp = {
  task: 'closeApp'
  time: OptTime
}

type NetDataApp = {
  task: 'dataApp'
  time: OptTime
  buffer: Uint8Array | ArrayBuffer
}

type NetMoveApp = {
  task: 'moveApp'
  time: OptTime
  x: number
  y: number
  width: number
  height: number
  deactivate: boolean
}

type NetCommands =
  | NetStartPath
  | NetAddToPath
  | NetFinishPath
  | NetAddPicture
  | NetAddForm
  | NetScrollBoard
  | NetDeleteObject
  | NetMoveObject
  | NetStartApp
  | NetCloseApp
  | NetDataApp
  | NetMoveApp

export class NetworkSink implements Sink {
  constructor(send: (command: NetCommands) => void) {
    this.sendfunc = send
  }

  startPath(
    time: OptTime,
    objnum: number,
    curclient: number,
    x: number,
    y: number,
    type: ToolType,
    color: ColorType,
    w: number,
    pressure: number
  ) {
    const outobj: NetStartPath = {
      task: 'startPath',
      time,
      objnum,
      curclient,
      x,
      y,
      type,
      color,
      w,
      pressure
    }
    this.sendfunc(outobj)
  }

  addToPath(
    time: OptTime,
    objnum: number,
    curclient: number,
    x: number,
    y: number,
    pressure: number
  ) {
    const outobj: NetAddToPath = {
      task: 'addToPath',
      time,
      objnum,
      curclient,
      x,
      y,
      pressure
    }
    this.sendfunc(outobj)
  }

  finishPath(time: OptTime, objnum: number, curclient: number) {
    const outobj: NetFinishPath = {
      task: 'finishPath',
      time,
      objnum,
      curclient
    }
    this.sendfunc(outobj)
  }

  addPicture(
    time: OptTime,
    objnum: number,
    curclient: number,
    x: number,
    y: number,
    width: number,
    height: number,
    uuid: string
  ) {
    const outobj: NetAddPicture = {
      task: 'addPicture',
      time,
      objnum,
      curclient,
      x,
      y,
      width,
      height,
      uuid
    }
    this.sendfunc(outobj)
  }

  addForm(
    time: OptTime,
    objnum: number,
    curclient: number,
    x: number,
    y: number,
    width: number,
    height: number,
    type: FormType,
    bColor: ColorType,
    fColor: ColorType,
    lw: number
  ) {
    const outobj: NetAddForm = {
      task: 'addForm',
      time,
      objnum,
      curclient,
      x,
      y,
      w: width,
      h: height,
      type,
      bColor,
      fColor,
      lw
    }
    this.sendfunc(outobj)
  }

  scrollBoard(time: OptTime, clientnum: ClientType, x: number, y: number) {
    const outobj: NetScrollBoard = {
      task: 'scrollBoard',
      time,
      clientnum,
      x,
      y
    }
    this.sendfunc(outobj)
  }

  deleteObject(
    time: OptTime,
    objnum: number,
    curclient: number,
    storagenum: DrawContainerId
  ) {
    const outobj: NetDeleteObject = {
      task: 'deleteObject',
      time,
      objnum,
      clientnum: curclient,
      storagenum
    }
    this.sendfunc(outobj)
  }

  moveObject(
    time: OptTime,
    objnum: number,
    curclient: number,
    x: number,
    y: number
  ) {
    const outobj: NetMoveObject = {
      task: 'moveObject',
      time,
      objnum,
      clientnum: curclient,
      x,
      y
    }
    this.sendfunc(outobj)
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
  ) {
    const obj: NetStartApp = {
      task: 'startApp',
      time,
      x,
      y,
      width,
      height,
      id,
      sha,
      appid
    }
    this.sendfunc(obj)
  }

  closeApp(time: OptTime) {
    const obj: NetCloseApp = {
      task: 'closeApp',
      time
    }
    this.sendfunc(obj)
  }

  dataApp(time: OptTime, buffer: Uint8Array | ArrayBuffer) {
    const obj: NetDataApp = {
      task: 'dataApp',
      time,
      buffer
    }
    this.sendfunc(obj)
  }

  moveApp(
    time: OptTime,
    x: number,
    y: number,
    width: number,
    height: number,
    deactivate: boolean
  ) {
    const obj: NetMoveApp = {
      task: 'moveApp',
      time,
      x,
      y,
      width,
      height,
      deactivate
    }
    this.sendfunc(obj)
  }
  protected sendfunc: (command: NetCommands) => void
}

export class NetworkSource {
  constructor(sink: Sink) {
    this.sink = sink
  }

  receiveData(data: NetCommands) {
    const sink = this.sink
    switch (data.task) {
      case 'startPath':
        // console.log("FDNS sP",data);
        sink.startPath(
          data.time,
          data.objnum,
          data.curclient,
          data.x,
          data.y,
          data.type,
          data.color,
          data.w,
          data.pressure
        )

        break
      case 'addToPath':
        // console.log("FDNS aTp",data);
        sink.addToPath(
          data.time,
          data.objnum,
          data.curclient,
          data.x,
          data.y,
          data.pressure
        )

        break
      case 'finishPath':
        // console.log("FDNS fP",data);
        sink.finishPath(data.time, data.objnum, data.curclient)

        break
      case 'scrollBoard':
        sink.scrollBoard(data.time, data.clientnum, data.x, data.y)

        break
      case 'addPicture':
        // console.log("addPicture in failsdata receive Data Networksource");
        sink.addPicture(
          data.time,
          data.objnum,
          data.curclient,
          data.x,
          data.y,
          data.width,
          data.height,
          data.uuid
        )

        break
      case 'addForm':
        sink.addForm(
          data.time,
          data.objnum,
          data.curclient,
          data.x,
          data.y,
          data.w,
          data.h,
          data.type,
          data.bColor,
          data.fColor,
          data.lw
        )
        break
      case 'deleteObject':
        sink.deleteObject(
          data.time,
          data.objnum,
          data.clientnum,
          data.storagenum
        )
        break
      case 'moveObject':
        sink.moveObject(data.time, data.objnum, data.clientnum, data.x, data.y)
        break
      case 'startApp':
        sink.startApp(
          data.time,
          data.x,
          data.y,
          data.width,
          data.height,
          data.id,
          data.sha,
          data.appid
        )
        break
      case 'closeApp':
        sink.closeApp(data.time)
        break
      case 'dataApp':
        sink.dataApp(data.time, data.buffer)
        break
      case 'moveApp':
        sink.moveApp(
          data.time,
          data.x,
          data.y,
          data.width,
          data.height,
          data.deactivate
        )
    }
  }
  protected sink: Sink
}
