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
export type RconConfig = { host: string; port: number; password: string }

export class Rcon extends EventEmitter<Events> {
  private _host: string
  private _port: number
  private _password: string
  private _token: null | string
  private _socket: null | Socket
  constructor(settings: RconConfig) {
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

  async send(data: string) {
    if (!this._token) return Promise.reject(NOT_AUTHENTICATED)
    const parts = ['rcon', this._token, this._password, data.trim()]
    return this._sendSocket(parts.filter(Boolean))
  }

  disconnect() {
    this._socket?.close()
    return this
  }

  isAuthorized() {
    return !!this._token
  }

  private _sendSocket = (parts: string[]) => {
    return new Promise<void>((resolve, reject) => {
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
        (error) => (error ? reject(error) : resolve()),
      )
    })
  }

  /** must always send an event (error|auth|response) */
  private _handleSocketMessage = (data: Buffer): boolean => {
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

    return this.emit('response', string.substr(1).replace(/\u0000+$/, ''))
  }

  private _handleSocketListening = () => {
    this.emit('connect')
    this._sendSocket(['challenge', 'rcon'])
  }
}
