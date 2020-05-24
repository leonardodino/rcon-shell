import { Rcon } from './rcon'

const errorRegExp = /Bad (?:challenge|rcon_password)\./

/** higher level abstraction over raw udp rcon */
export class RconClient {
  address: string
  private readonly _config: ConstructorParameters<typeof Rcon>[0]
  private readonly _rcon: Rcon
  constructor(config: ConstructorParameters<typeof Rcon>[0]) {
    this._config = config
    this._rcon = new Rcon(config)
    this.address = `${config.host}:${config.port}`
  }

  clone() {
    return new RconClient(this._config)
  }

  connect(onDisconnect?: () => void): Promise<void> {
    if (onDisconnect) this._rcon.once('close', onDisconnect)
    const promise = this.ready()
    this._rcon.connect()
    return promise
  }

  disconnect(): Promise<void> {
    const promise = new Promise<void>((resolve) =>
      this._rcon.on('close', resolve),
    )
    this._rcon.disconnect()
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

    return new Promise<string>((resolve, reject) => {
      const rejectAndCleanup = (error: Error) => (cleanup(), reject(error))
      const cleanup = () => {
        clearTimeout(timeout)
        this._rcon.off('error', rejectAndCleanup)
        this._rcon.off('response', collect)
      }
      const collect = (message: string) => {
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
      this._rcon.on('response', collect)
      this._rcon.on('error', rejectAndCleanup)
      promise = this._rcon.send(command).catch(rejectAndCleanup)
    })
  }
}
