import path from 'path';
import fs from 'fs-extra';
import { TailwindConfig } from 'tailwindcss/tailwind-config';
import { PluginConfigOpts, PluginConfigOptsDefaults } from '../index';
import { warn } from '../debug/logger';

let _configuration: PluginConfigOpts | undefined;

function makeDefaultTailwindConf(): TailwindConfig {
  const twConf = {
    content: [],
    theme: {
      extend: {}
    },
    plugins: []
  };
  // HACK! Current tailwind types don't have the 'jit' mode field so make the type
  // look as if it is meant to be there
  return (twConf as unknown) as TailwindConfig;
}

export const PluginConfigDefaults: PluginConfigOptsDefaults = {
  DEFAULT: {
    enableDebug: false,
    tailwindCssPath: undefined,
    tailwindCssContents: '@tailwind base;@tailwind utilities;@tailwind components;',
    tailwindConf: makeDefaultTailwindConf(),
    stripComments: false,
    minify: true,
    useAutoPrefixer: false
  }
};

export function getConfiguration(): PluginConfigOpts {
  return _configuration ?? PluginConfigDefaults.DEFAULT;
}

export function makeTailwindConfig(contentFileList: string[]): TailwindConfig {
  const twConf = Object.assign({}, _configuration.tailwindConf, { content: contentFileList });
  return twConf;
}

function fetchTailwindCssContents(tailwindCssPath?: string): string | null {
  const tailwindCssContents = fs.readFileSync(path.resolve(tailwindCssPath)).toString();

  if (tailwindCssContents.length === 0) {
    warn('No css found when reading Tailwind configuration css - path', tailwindCssPath);
    return null;
  }

  return tailwindCssContents;
}

export function configurePluginOptions(opts: PluginConfigOpts) : void {
  _configuration = Object.assign({}, opts);

  if (_configuration.tailwindCssPath) {
    _configuration.tailwindCssContents = fetchTailwindCssContents(_configuration.tailwindCssPath) ?? _configuration.tailwindCssContents;
  }
}
