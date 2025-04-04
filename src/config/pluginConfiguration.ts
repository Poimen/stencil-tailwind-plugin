import path from 'path';
import fs from 'fs-extra';
import { PluginConfigurationOptions, PluginConfigOptionsDefaults } from '../index';
import { warn } from '../debug/logger';
import { makeDefaultTailwindConf } from '../helpers/tailwindcss';

// function makeDefaultTailwindConf() {
//   return () => '@import "tailwindcss";';
// }

// function buildTailwindConfigurationBasedOnUserObject(userConfiguration: TailwindConfig): TailwindPluginFunctionalConfig {
//   return (_: string, config: TailwindConfig): TailwindConfig => {
//     const includePreflight = config.corePlugins['preflight'];
//     let preflight = includePreflight;

//     if (Array.isArray(userConfiguration.corePlugins)) {
//       // user configuration is disabling all core plugins...
//       return {
//         ...userConfiguration,
//         ...config,
//         corePlugins: [],
//       };
//     }

//     if (includePreflight && userConfiguration.corePlugins) {
//       // if we are including the preflight, resolve to the user configuration value if available

//       preflight = userConfiguration.corePlugins['preflight'] ?? true;
//     }
//     return {
//       ...userConfiguration,
//       content: config.content,
//       corePlugins: {
//         ...userConfiguration.corePlugins,
//         preflight,
//       },
//     };
//   };
// }

// export function resolveTailwindConfigurationFromUserSettings(tailwindConf: TailwindPluginConfig, contentFileList: string[], includePreflight: boolean): TailwindConfig {
// export function resolveTailwindConfigurationFromUserSettings(tailwindConf: TailwindPluginConfig, contentFileList: string[]) {
//   // Resolve the Tailwind configuration based on the user function
//   return tailwindConf(contentFileList[0]);

//   // const tailwindResolver = tailwindConf as TailwindPluginFunctionalConfig;
//   // return {};
//   // return tailwindResolver(contentFileList[0], {
//   //   content: contentFileList,
//   //   corePlugins: {
//   //     preflight: includePreflight,
//   //   },
//   // });
// }

export const PluginConfigDefaults: PluginConfigOptionsDefaults = {
  DEFAULT: {
    enableDebug: false,
    stripComments: false,
    minify: true,
  },
};

// function fetchTailwindCssContents(tailwindCssPath?: string): string | null {
//   const tailwindCssContents = fs.readFileSync(path.resolve(tailwindCssPath)).toString();

//   if (tailwindCssContents.length === 0) {
//     warn('No css found when reading Tailwind configuration css - path', tailwindCssPath);
//     return null;
//   }

//   return tailwindCssContents;
// }

function fetchTailwindCssContents(tailwindCssPath?: string) {
  const tailwindCssContents = fs.readFileSync(path.resolve(tailwindCssPath)).toString();

  if (tailwindCssContents.length === 0) {
    warn('No css found when reading Tailwind configuration css - path', tailwindCssPath);
    warn('Falling back to default tailwindcss configuration');
    return makeDefaultTailwindConf();
  }

  return () => tailwindCssContents;
}

function validateConfigurationOptions(opts: PluginConfigurationOptions) {
  if (opts.minify && opts.optimise) {
    warn('Both minify and optimise are set. Defaulting to minify.');
  }

  if (opts.injectTailwindConfiguration && opts.tailwindCssPath) {
    warn('Both tailwind configuration injection and CSS path are set. Default to injection function.');
  }
}

export function configurePluginOptions(opts: PluginConfigurationOptions) {
  const configuration = Object.assign({}, opts);

  validateConfigurationOptions(configuration);

  if (!configuration.injectTailwindConfiguration && configuration.tailwindCssPath) {
    configuration.injectTailwindConfiguration = fetchTailwindCssContents(configuration.tailwindCssPath);
  } else if (!configuration.injectTailwindConfiguration) {
    configuration.injectTailwindConfiguration = makeDefaultTailwindConf();
  }

  // if (configuration.tailwindCssPath) {
  //   configuration.tailwindCssContents = fetchTailwindCssContents(configuration.tailwindCssPath) ?? configuration.tailwindCssContents;
  // }

  // if (typeof configuration.tailwindConf !== 'function') {
  //   const userConfiguration = configuration.tailwindConf as TailwindConfig;
  //   configuration.tailwindConf = buildTailwindConfigurationBasedOnUserObject(userConfiguration);
  // }

  return configuration;
}
