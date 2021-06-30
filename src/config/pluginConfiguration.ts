import path from 'path';
import fs from 'fs-extra';
import { TailwindConfig } from 'tailwindcss/tailwind-config';
import { PluginConfigOpts, PluginConfigOptsDefaults } from '../index';
import * as log from '../debug/logger';

let _configuration: PluginConfigOpts | undefined;

function makeDefaultTailwindConf(): TailwindConfig {
  const twConf = {
    mode: 'jit',
    purge: [],
    darkMode: false,
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
    enablePurge: true,
    purgeSafeList: [
      ':root',
      ':host',
      ':shadow',
      '/deep/',
      '::part',
      '::theme'
    ],
    purgeExtractor: function tailwindExtractor(content: string) {
      // Capture as liberally as possible, including things like `h-(screen-1.5)`
      const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
      const broadMatchesWithoutTrailingSlash = broadMatches.map((match: string) => match.trimEnd().replace(/\\/g, ''));

      // Capture classes within other delimiters like .block(class="w-1/2") in Pug
      const innerMatches = content.match(/[^<>"'`\s.(){}[\]#=%]*[^<>"'`\s.(){}[\]#=%:]/g) || [];

      return broadMatches.concat(broadMatchesWithoutTrailingSlash).concat(innerMatches);
    }
  }
};

export function getConfiguration(): PluginConfigOpts {
  return _configuration ?? PluginConfigDefaults.DEFAULT;
}

export function makeTailwindConfig(purgeFileList: string[]): TailwindConfig {
  _configuration.tailwindConf.purge = purgeFileList;
  return _configuration.tailwindConf;
}

function fetchTailwindCssContents(tailwindCssPath?: string): string | null {
  const tailwindCssContents = fs.readFileSync(path.resolve(tailwindCssPath)).toString();

  if (tailwindCssContents.length === 0) {
    log.warn('No css found when reading Tailwind configuration css - path', tailwindCssPath);
    return null;
  }

  return tailwindCssContents;
}

export function configurePluginOptions(opts: PluginConfigOpts) : void {
  _configuration = opts;

  if (_configuration.tailwindCssPath) {
    _configuration.tailwindCssContents = fetchTailwindCssContents(_configuration.tailwindCssPath) ?? _configuration.tailwindCssContents;
  }
}
