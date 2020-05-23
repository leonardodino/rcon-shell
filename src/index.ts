#!/usr/bin/env node

import { Rcon } from './rcon'
import { RconClient } from './rcon-client'
import { CLI } from './cli'
export { Rcon, RconClient, CLI }

if (module === require.main) CLI()
