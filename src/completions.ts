import type { RconClient } from './rcon-client'

const separatorRegExp = /^-+$/

const parseList = (string: string, done = -1) => {
  let output = new Set<string>()
  const lines = string.replace(/[^\x00-\x7F]+/g, '').split('\n')
  for (const _line of lines) {
    const line = _line.trim()
    if (separatorRegExp.test(line) && !++done) continue
    if (done === 1) break
    if (done === 0) output.add(line)
  }
  return output
}

export class Completions {
  private readonly _client: RconClient
  private _cmdlist: string[] = []
  private _maps: string[] = []
  private _busy: boolean = false

  constructor(client: RconClient) {
    this._client = client.clone()
  }

  async load() {
    if (this._busy) this._busy = true
    await this._client.connect()

    const cmdlist = parseList(await this._client.send('cmdlist'))
    this._cmdlist = (cmdlist.delete('changelevel2'), [...cmdlist].sort())

    if (cmdlist.has('changelevel') && cmdlist.has('maps')) {
      const maps = parseList(await this._client.send('maps *'))
      this._maps = [...maps].sort()
    }

    await this._client.disconnect()
    this._busy = false
  }

  completer = (line: string): [string[], string] => {
    const clean = line.trimStart()
    const { 0: cmd, 1: arg = '', length } = clean.split(/\s+/)

    if (length > 2) return [[], line]

    if (cmd === 'changelevel' && length) {
      const suggestions = this._maps
        .filter((map) => map.startsWith(arg))
        .map((map) => `${map.replace(/\.bsp$/, '')} `)
      return [suggestions, arg]
    }

    const suggestions = this._cmdlist
      .filter((cmd) => cmd.startsWith(clean.trimEnd()))
      .map((cmd) => `${cmd} `)
    return [suggestions, clean]
  }
}
