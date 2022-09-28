import path from 'path';
import fs from 'fs-extra';
import { Config as TailwindConfig } from 'tailwindcss';
import { PluginConfigOpts, PluginConfigOptsDefaults, TailwindPluginConfig } from '../index';
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

function buildTailwindConfigurationBasedOnUserObject(tailwindConf: TailwindConfig, contentFileList: string[], includePreflight: boolean): TailwindConfig {
  let preflight = includePreflight;

  if (Array.isArray(tailwindConf.corePlugins)) {
    // user configuration is disabling all core plugins...
    return {
      ...tailwindConf,
      content: contentFileList,
      corePlugins: []
    };
  }

  if (includePreflight && tailwindConf.corePlugins) {
    // if we are including the preflight, resolve to the user configuration value if available
    // eslint-disable-next-line dot-notation
    preflight = tailwindConf.corePlugins['preflight'] ?? true;
  }
  return {
    ...tailwindConf,
    content: contentFileList,
    corePlugins: {
      ...tailwindConf.corePlugins,
      preflight
    }
  };
}

export function resolveTailwindConfigurationFromUserSettings(tailwindConf: TailwindPluginConfig, contentFileList: string[], includePreflight: boolean): TailwindConfig {
  if (typeof tailwindConf !== 'function') {
    // Tailwind configuration is not coming from a function, so just resort back to the object configuration
    return buildTailwindConfigurationBasedOnUserObject(tailwindConf as TailwindConfig, contentFileList, includePreflight);
  }

  // Resolve the Tailwind configuration based on the user function
  return tailwindConf(contentFileList[0], {
    content: contentFileList,
    corePlugins: {
      preflight: includePreflight
    }
  });
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
