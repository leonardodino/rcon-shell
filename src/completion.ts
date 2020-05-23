import { Rcon } from './rcon'

const delimiter = /^-+$/

const fetchCmdList = async (connection: Rcon) => {
  await connection.connect().ready()
  Promise.all([
    connection.send('cmdlist'),
    
  ]).finally(() => connection.disconnect())

  let state = 0
  for await (const message of connection) {
    for (const line of message.split('\n')) {
      if (delimiter.test(line.trim())) {
        state++
      } else if (state === 1) console.log(line.trim())
    }
  }
}

export const completion = async (
  config: ConstructorParameters<typeof Rcon>[0],
) => {
  const cmdlist = {}

  const connection = new Rcon(config)
  await fetchCmdList(connection)
  console.log('> !!! end !!!')
}
