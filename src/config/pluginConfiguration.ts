import path from 'path';
import fs from 'fs-extra';
import { PluginConfigurationOptions, PluginConfigOptionsDefaults } from '../index';
import { warn } from '../debug/logger';
import { makeDefaultTailwindConf } from '../helpers/tailwindcss';

export const PluginConfigDefaults: PluginConfigOptionsDefaults = {
  DEFAULT: {
    enableDebug: false,
    stripComments: false,
    minify: true,
  },
};

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

  return configuration;
}
