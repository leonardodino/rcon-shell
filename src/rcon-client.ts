import { Rcon, RconConfig } from './rcon'
import { EventEmitter } from './event-emitter'

const errorRegExp = /Bad (?:challenge|rcon_password)\./

type Message = string | Error
type ClientEvents = { message: (message: Message) => void }

/** higher level abstraction over raw udp rcon */
export class RconClient extends EventEmitter<ClientEvents> {
  address: string
  private readonly _config: RconConfig
  private readonly _rcon: Rcon
  private readonly _emit = (message: Message) => this.emit('message', message)
  private readonly _handleRcon = (message: Message) => this._handler(message)

  /** this is a mutable pointer! */
  private _handler: ClientEvents['message'] = this._emit

  constructor(config: RconConfig) {
    super()
    this._config = config
    this._rcon = new Rcon(config)
    this.address = `${config.host}:${config.port}`
  }

  clone() {
    return new RconClient(this._config)
  }

  async connect(onDisconnect?: () => void): Promise<void> {
    if (onDisconnect) this._rcon.once('close', onDisconnect)
    const promise = this.ready()
    this._rcon.connect()
    await promise
    this._rcon.on('error', this._handleRcon)
    this._rcon.on('response', this._handleRcon)
  }

  disconnect(): Promise<void> {
    const promise = new Promise<void>((resolve) =>
      this._rcon.on('close', resolve),
    )
    this._rcon.disconnect()
    this._rcon.off('error', this._handleRcon)
    this._rcon.off('response', this._handleRcon)
    return promise
  }

  ready(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._rcon.isAuthorized()) return resolve()
      const dispose = () => {
        this._rcon.off('auth', resolve)
        this._rcon.off('error', reject)
      }
      this._rcon.on('auth', () => (dispose(), resolve()))
      this._rcon.on('error', () => (dispose(), reject()))
    })
  }

  send(command: string): Promise<string> {
    const chunks: string[] = []
    let timeout: NodeJS.Timeout
    let promise: Promise<void>
    const cleanup = () => {
      clearTimeout(timeout)
      this._handler = this._emit
    }

    return new Promise<string>((resolve, reject) => {
      const rejectAndCleanup = (error: Error) => (cleanup(), reject(error))
      this._handler = (message: Message) => {
        if (message instanceof Error) return rejectAndCleanup(message)

        chunks.push(message)
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          promise.then(() => {
            cleanup()
            const result = chunks.join('')
            if (errorRegExp.test(result)) {
              const error = new Error(result)
              error.name = 'AuthError'
              return reject(error)
            }
            return resolve(result)
          })
        }, 32)
      }
      promise = this._rcon.send(command).catch(rejectAndCleanup)
    })
  }
}
