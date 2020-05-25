import type { RconClient } from './rcon-client'

const separatorRegExp = /^-+$/
const cvarRegExp = /^([^_:\s][^:\s]+)\s*:.*, sv$/

const parseList = (string: string, done = -1) => {
  const output = new Set<string>()
  const lines = string.replace(/[^\x00-\x7F]+/g, '').split('\n')
  for (const _line of lines) {
    const line = _line.trim()
    if (separatorRegExp.test(line) && !++done) continue
    if (done === 1) break
    if (done === 0) output.add(line)
  }
  return output
}

const parseCmdList = (string: string) => {
  const cmdlist = parseList(string)
  return cmdlist.delete('changelevel2'), cmdlist
}

const parseCvarList = (string: string) => {
  const output = new Set<string>()
  for (const line of parseList(string)) {
    const cvar = (line.match(cvarRegExp) || [])[1]
    if (cvar) output.add(cvar)
  }
  return output
}

export class Completions {
  private readonly _client: RconClient
  private _cmds: string[] = []
  private _maps: string[] = []

  constructor(client: RconClient) {
    this._client = client.clone()
  }

  async load() {
    await this._client.connect()

    const cmdlist = parseCmdList(await this._client.send('cmdlist'))
    this._cmds = [...new Set([...this._cmds, ...cmdlist])].sort()

    if (cmdlist.has('changelevel') && cmdlist.has('maps')) {
      const maps = parseList(await this._client.send('maps *'))
      this._maps = [...new Set([...this._maps, ...maps])].sort()
    }

    if (cmdlist.has('cvarlist')) {
      const cvarlist = parseCvarList(await this._client.send('cvarlist'))
      this._cmds = [...new Set([...this._cmds, ...cvarlist])].sort()
    }

    await this._client.disconnect()
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

    const suggestions = this._cmds
      .filter((cmd) => cmd.startsWith(clean.trimEnd()))
      .map((cmd) => `${cmd} `)
    return [suggestions, clean]
  }
}
