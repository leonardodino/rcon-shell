import { createInterface } from 'readline'
import { Rcon } from './rcon'
import {completion} from './completion'

const {
  RCON_HOST = '127.0.0.1',
  RCON_PORT = '27015',
  RCON_PASSWORD = '',
} = process.env

export const CLI = (
  overrides?: Partial<ConstructorParameters<typeof Rcon>[0]>,
) => {
  const config = {
    host: RCON_HOST,
    port: +RCON_PORT,
    password: RCON_PASSWORD,
    ...overrides,
  }

  const connection = new Rcon(config)

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\u001b[33mRCON>\u001b[0m ',
  })

  process.stdout.write(`Connecting to ${RCON_HOST}:${RCON_PORT}\n`)

  connection.on('auth', () => {
    // connection.send('status')
    // connection.send('cvarlist')
    completion(config)
  })

  connection.on('response', (res) => {
    process.stdout.write(res)
    if (res.includes('Bad rcon_password.')) process.exit(1)
    rl.prompt()
  })

  connection.on('error', (error) => {
    process.stderr.write(`\u001b[31m!\u001b[0m ${error.message}`)
  })

  connection.on('close', () => {
    process.stdout.write('Socket closed!')
    process.exit()
  })

  connection.connect()

  rl.on('line', (line) => {
    if (['exit', 'quit'].includes(line)) return process.exit(0)

    connection.send(line)
  })

  connection.on('close', () => process.exit(0))
}
