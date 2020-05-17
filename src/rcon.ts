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
  #host: string
  #port: number
  #password: string
  #token: null | string
  #socket: null | Socket
  constructor(settings: { host: string; port: number; password: string }) {
    super()
    this.#host = settings.host
    this.#port = settings.port
    this.#password = settings.password
    this.#token = null
    this.#socket = null
  }

  connect() {
    this.#socket = createSocket('udp4')
    this.#socket
      .on('listening', this.#handleSocketListening)
      .on('message', this.#handleSocketMessage)
      .on('error', (error) => this.emit('error', error))
      .on('close', () => this.emit('close'))
      .bind(0)

    return this
  }

  send(data: string) {
    if (!this.#token) return this.emit('error', NOT_AUTHENTICATED)
    const parts = ['rcon', this.#token, this.#password, data.trim()]
    this.#sendSocket(parts.filter(Boolean))
  }

  disconnect() {
    this.#socket?.close()
    return this
  }

  #sendSocket = (parts: string[]) => {
    if (!this.#socket) return this.emit('error', NOT_CONNECTED)
    const string = parts.join(' ') + '\n'
    const buffer = Buffer.alloc(offset + Buffer.byteLength(string))
    buffer.writeInt32LE(-1, 0)
    buffer.write(string, offset)
    this.#socket.send(buffer, 0, buffer.length, this.#port, this.#host)
  }

  #handleSocketMessage = (data: Buffer) => {
    if (data.readUInt32LE(0) !== 0xffffffff) {
      return this.emit('error', new Error('Received malformed packet'))
    }

    const string = data.toString('utf-8', offset)
    const parts = string.split(' ')
    if (parts.length === 3 && parts[0] === 'challenge' && parts[1] === 'rcon') {
      this.#token = parts[2].substr(0, parts[2].length - 1).trim()
      return this.emit('auth')
    }

    return this.emit('response', string.substr(1, string.length - 2))
  }

  #handleSocketListening = () => {
    this.emit('connect')
    this.#sendSocket(['challenge', 'rcon'])
  }
}
