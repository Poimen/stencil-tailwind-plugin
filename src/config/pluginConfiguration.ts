import path from 'path';
import fs from 'fs-extra';
import { Config as TailwindConfig } from 'tailwindcss';
import { PluginConfigOpts, PluginConfigOptsDefaults } from '../index';
import { warn } from '../debug/logger';

function makeDefaultTailwindConf(): TailwindConfig {
  return {
    content: [],
    theme: {
      extend: {}
    },
    plugins: []
  };
}

export const PluginConfigDefaults: PluginConfigOptsDefaults = {
  DEFAULT: {
    enableDebug: false,
    tailwindCssPath: undefined,
    tailwindCssContents: '@tailwind base;@tailwind utilities;@tailwind components;',
    tailwindConf: makeDefaultTailwindConf(),
    stripComments: false,
    minify: true,
    useAutoPrefixer: true
  }
};

export function makeTailwindConfig(conf: PluginConfigOpts, contentFileList: string[], includePreflight: boolean): TailwindConfig {
  let preflight = includePreflight;

  if (Array.isArray(conf.tailwindConf.corePlugins)) {
    // user configuration is disabling all core plugins...
    return {
      ...conf.tailwindConf,
      content: contentFileList,
      corePlugins: []
    };
  }

  if (includePreflight && conf.tailwindConf.corePlugins) {
    // if we are including the preflight, resolve to the user configuration value if available
    // eslint-disable-next-line dot-notation
    preflight = conf.tailwindConf.corePlugins['preflight'] ?? true;
  }
  return {
    ...conf.tailwindConf,
    content: contentFileList,
    corePlugins: {
      ...conf.tailwindConf.corePlugins,
      preflight
    }
  };
}

function fetchTailwindCssContents(tailwindCssPath?: string): string | null {
  const tailwindCssContents = fs.readFileSync(path.resolve(tailwindCssPath)).toString();

  if (tailwindCssContents.length === 0) {
    warn('No css found when reading Tailwind configuration css - path', tailwindCssPath);
    return null;
  }

  return tailwindCssContents;
}

export function configurePluginOptions(opts: PluginConfigOpts): PluginConfigOpts {
  const configuration = Object.assign({}, opts);

  if (configuration.tailwindCssPath) {
    configuration.tailwindCssContents = fetchTailwindCssContents(configuration.tailwindCssPath) ?? configuration.tailwindCssContents;
  }

  return configuration;
}
