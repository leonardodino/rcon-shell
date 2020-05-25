import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import shebang from 'rollup-plugin-preserve-shebang'
import { terser } from 'rollup-plugin-terser'
import filesize from 'rollup-plugin-filesize'
import pkg from './package.json'

/** @type {import('rollup').RollupOptions[]} */
const config = [pkg.main, pkg.bin].map((file) => ({
  input: file.replace(/^dist\//, 'src/').replace(/\.js$/, ''),
  output: { file, format: 'cjs' },
  onwarn: (warning) => {
    throw new Error(warning.message)
  },
  external: ['buffer', 'dgram', 'readline', 'events'],
  watch: { include: ['src/**'] },
  plugins: [
    shebang(),
    babel({ babelHelpers: 'bundled', extensions: ['.ts'] }),
    resolve({ browser: false, extensions: ['.ts'] }),
    terser({
      ecma: 8,
      compress: { unsafe: true },
      mangle: { properties: { regex: '^_' } },
    }),
    filesize({ showBeforeSizes: process.env.CI }),
  ],
}))

export default config
