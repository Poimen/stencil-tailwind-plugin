import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const moduleName = pkg.name.replace(/^@.*\//, '');
const inputFileName = 'src/index.ts';
const author = pkg.author;
const banner = `
  /**
   * @license
   * author: ${author}
   * ${moduleName}.js v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`;

export default {
  input: inputFileName,
  output: [{
    file: pkg.main,
    format: 'cjs', // commonJS
    sourcemap: true,
    banner,
    plugins: [
      terser()
    ]
  }, {
    file: pkg.module,
    format: 'esm', // ES Modules
    sourcemap: true,
    banner,
    plugins: [
      terser()
    ]
  }],
  plugins: [
    peerDepsExternal(),
    typescript()
  ]
};
