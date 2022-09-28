import path from 'path';
import fs from 'fs-extra';
import { Config as TailwindConfig } from 'tailwindcss';
import { PluginConfigOpts, PluginConfigOptsDefaults, TailwindPluginConfig, TailwindPluginFunctionalConfig } from '../index';
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

function buildTailwindConfigurationBasedOnUserObject(userConfiguration: TailwindConfig): TailwindPluginFunctionalConfig {
  return (_: string, config: TailwindConfig): TailwindConfig => {
    // eslint-disable-next-line dot-notation
    const includePreflight = config.corePlugins['preflight'];
    let preflight = includePreflight;

    if (Array.isArray(userConfiguration.corePlugins)) {
      // user configuration is disabling all core plugins...
      return {
        ...userConfiguration,
        ...config,
        corePlugins: []
      };
    }

    if (includePreflight && userConfiguration.corePlugins) {
      // if we are including the preflight, resolve to the user configuration value if available
      // eslint-disable-next-line dot-notation
      preflight = userConfiguration.corePlugins['preflight'] ?? true;
    }
    return {
      ...userConfiguration,
      content: config.content,
      corePlugins: {
        ...userConfiguration.corePlugins,
        preflight
      }
    };
  };
}

export function resolveTailwindConfigurationFromUserSettings(tailwindConf: TailwindPluginConfig, contentFileList: string[], includePreflight: boolean): TailwindConfig {
  // Resolve the Tailwind configuration based on the user function
  const tailwindResolver = tailwindConf as TailwindPluginFunctionalConfig;
  return tailwindResolver(contentFileList[0], {
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

  if (typeof configuration.tailwindConf !== 'function') {
    const userConfiguration = configuration.tailwindConf as TailwindConfig;
    configuration.tailwindConf = buildTailwindConfigurationBasedOnUserObject(userConfiguration);
  }

  return configuration;
}
