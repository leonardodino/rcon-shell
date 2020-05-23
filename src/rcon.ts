import { Buffer } from 'buffer'
import { createSocket, Socket } from 'dgram'
import { EventEmitter } from './event-emitter'

export const NOT_AUTHENTICATED = new Error('Not authenticated')
export const NOT_CONNECTED = new Error('Not connect')

const offset = 4

type Events = {
  error: (error: Error) => void
  response: (message: string) => void
  close: () => void
  auth: () => void
  connect: () => void
}

export class Rcon extends EventEmitter<Events> {
  private _host: string
  private _port: number
  private _password: string
  private _token: null | string
  private _socket: null | Socket
  constructor(settings: { host: string; port: number; password: string }) {
    super()
    this._host = settings.host
    this._port = settings.port
    this._password = settings.password
    this._token = null
    this._socket = null
  }

  connect() {
    this._socket = createSocket('udp4')
    this._socket
      .on('listening', this._handleSocketListening)
      .on('message', this._handleSocketMessage)
      .on('error', (error) => this.emit('error', error))
      .on('close', () => this.emit('close'))
      .bind(0)

    return this
  }

  send(data: string) {
    if (!this._token) return Promise.reject(NOT_AUTHENTICATED)
    const parts = ['rcon', this._token, this._password, data.trim()]
    return this._sendSocket(parts.filter(Boolean))
  }

  disconnect() {
    this._socket?.close()
    return this
  }

  ready() {
    if (this._token) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      const dispose = () => {
        this.off('auth', resolve)
        this.off('error', reject)
      }
      this.on('auth', () => (dispose(), resolve()))
      this.on('error', () => (dispose(), reject()))
    })
  }

  [Symbol.asyncIterator](): AsyncIterator<string> {
    const ready = this.ready()
    const status = { done: false }
    const queue: string[] = []
    const push = (message: string) => queue.push(message)
    this.on('response', push)
    this.once('close', () => {
      this.off('response', push)
      status.done = true
    })
    const next = async (): Promise<{ value: string; done: boolean }> => {
      await ready
      if (queue.length) {
        return {
          value: queue.shift()!,
          done: queue.length === 0 && status.done,
        }
      }
      if (status.done) return { done: true, value: '' }
      await new Promise((resolve) => {
        const settle = () => {
          resolve()
          this.off('response', settle)
          this.off('close', settle)
        }
        this.on('response', settle)
        this.on('close', settle)
      })
      return await next()
    }

    return { next }
  }

  private _sendSocket = (parts: string[]) =>
    new Promise<void>((resolve, reject) => {
      if (!this._socket) return reject(NOT_CONNECTED)
      const string = parts.join(' ') + '\n'
      const buffer = Buffer.alloc(offset + Buffer.byteLength(string))
      buffer.writeInt32LE(-1, 0)
      buffer.write(string, offset)
      this._socket.send(
        buffer,
        0,
        buffer.length,
        this._port,
        this._host,
        (err) => (err ? reject(err) : resolve()),
      )
    })

  private _handleSocketMessage = (data: Buffer) => {
    if (
      data.readUInt32LE(0) === 0xfffffffe &&
      data.readUInt8(5) === 0x00 &&
      data.readUInt16LE(6) === 0x0000
    ) {
      data = Buffer.concat([
        Buffer.from([0xff, 0xff, 0xff, 0xff]),
        Uint8Array.prototype.slice.call(data, 13),
      ])
    }

    if (data.readUInt32LE(0) !== 0xffffffff) {
      return this.emit('error', new Error('Received malformed packet'))
    }

    const string = data.toString('utf-8', offset)
    const parts = string.split(' ')
    if (parts.length === 3 && parts[0] === 'challenge' && parts[1] === 'rcon') {
      this._token = parts[2].substr(0, parts[2].length - 1).trim()
      return this.emit('auth')
    }

    return this.emit('response', string.substr(1, string.length - 2))
  }

  private _handleSocketListening = () => {
    this.emit('connect')
    return this._sendSocket(['challenge', 'rcon'])
  }
}
