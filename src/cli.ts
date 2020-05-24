import { createInterface } from 'readline'
import { RconClient } from './rcon-client'
import { Completions } from './completions'

const {
  RCON_HOST = '127.0.0.1',
  RCON_PORT = '27015',
  RCON_PASSWORD = '',
} = process.env

const handle = <T>(p: Promise<T>): Promise<T | Error> =>
  new Promise(p.then.bind(p))

const write = (message: string | Error) => {
  if (typeof message === 'string') {
    return process.stdout.write(`\u001b[K${message}`)
  }
  const error = message.toString().trim()
  process.stderr.write(`\u001b[K\u001b[31m!\u001b[0m ${error}\n`)
  if (message.name === 'AuthError') process.exit(1)
}

const send = async (client: RconClient, command: string) =>
  write(await handle(client.send(command)))

export const CLI = async (
  overrides?: Partial<ConstructorParameters<typeof RconClient>[0]>,
) => {
  const client = new RconClient({
    host: RCON_HOST,
    port: +RCON_PORT,
    password: RCON_PASSWORD,
    ...overrides,
  }).on('message', (message) => {
    write(typeof message === 'string' ? `\r${message.trimEnd()}\n` : message)
    rl.prompt()
  })

  const completions = new Completions(client)

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    removeHistoryDuplicates: true,
    prompt: '\u001b[33mRCON>\u001b[0m ',
    completer: completions.completer,
  }).on('close', () => process.exit(0))

  process.stdout.write(`Connecting to ${client.address}...\r`)

  await client.connect(() => {
    process.stdout.write('Socket closed!')
    process.exit()
  })

  await send(client, 'status')
  completions.load()

  rl.prompt()
  for await (const line of rl) {
    if (['exit', 'quit'].includes(line)) return process.exit(0)
    await send(client, line)
    rl.prompt()
  }
}
