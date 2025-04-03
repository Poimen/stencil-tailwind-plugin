import { defineConfig } from 'rolldown';
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

export default defineConfig({
  input: inputFileName,
  output: [{
    file: pkg.module,
    format: 'esm', // ES Modules
    sourcemap: true,
    exports: 'named',
    banner,
  }],
});
