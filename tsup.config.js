import { defineConfig } from 'tsup';
import pkg from './package.json' with {type: 'json'};

const moduleName = pkg.name.replace(/^@.*\//, '');
const banner = `
  /**
   * @license
   * author: ${pkg.author}
   * ${moduleName}.js v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`;

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  banner: {
    js: banner,
    css: banner,
  },
});
