#!/usr/bin/env node

import { Rcon, RconClient } from './esm'
import { RconShell } from './rcon-shell'
export { Rcon, RconClient, RconShell }

if (module === require.main) RconShell()
