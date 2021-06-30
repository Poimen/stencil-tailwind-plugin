import { TailwindConfig } from 'tailwindcss/tailwind-config';
import { Plugin } from 'rollup';
import { setupTailwindConfiguration } from './config/tailwindConfiguration';
import { configureLogging } from './debug/logger';
import * as plugin from './plugin';

export interface PluginOptions {
  debug?: boolean;
  tailwindConf?: TailwindConfig;
  tailwindCssPath?: string;
  stripComments?: boolean;
}

function configureOptions(opts?: PluginOptions) {
  const defaults = {
    debug: false,
    tailwindConf: undefined,
    tailwindCssPath: undefined,
    stripComments: false
  };

  const options = Object.assign({}, defaults, opts);
  setupTailwindConfiguration({
    tailwindCssPath: options.tailwindCssPath,
    tailwindConf: options.tailwindConf,
    stripComments: options.stripComments
  });
  configureLogging(options.debug);
}

export default function tailwindPlugin(opts?: PluginOptions): Plugin {
  configureOptions(opts);

  return {
    name: 'tailwind',
    buildStart: plugin.buildStart,
    transform: plugin.transform,
    buildEnd: plugin.buildEnd
  };
}
