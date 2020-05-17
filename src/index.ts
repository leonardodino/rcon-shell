#!/usr/bin/env node

import { Rcon } from './rcon'
import { CLI } from './cli'
export { Rcon, CLI }

if (module === require.main) CLI()
