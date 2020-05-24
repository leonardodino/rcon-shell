import { createInterface } from 'readline'
import { RconClient } from './rcon-client'
import { Completions } from './completions'

const {
  RCON_HOST = '127.0.0.1',
  RCON_PORT = '27015',
  RCON_PASSWORD = '',
} = process.env

const send = async (client: RconClient, command: string) => {
  try {
    // TODO: add Promise.race for ctrl+c
    const result = await client.send(command)
    process.stdout.write(`\u001b[K${result}`)
  } catch (error) {
    const message = error.toString().trim()
    process.stderr.write(`\u001b[K\u001b[31m!\u001b[0m ${message}\n`)
    if (error.name === 'AuthError') process.exit(1)
  }
}

export const CLI = async (
  overrides?: Partial<ConstructorParameters<typeof RconClient>[0]>,
) => {
  const client = new RconClient({
    host: RCON_HOST,
    port: +RCON_PORT,
    password: RCON_PASSWORD,
    ...overrides,
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

  rl.on('line', async (line) => {
    if (['exit', 'quit'].includes(line)) return process.exit(0)
    await send(client, line)
    rl.prompt()
  }).prompt()
}
