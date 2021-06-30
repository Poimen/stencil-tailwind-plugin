import { Plugin } from 'rollup';
import { TailwindConfig } from 'tailwindcss/tailwind-config';
import * as conf from './config/pluginConfiguration';
import { configureLogging } from './debug/logger';
import * as plugin from './plugin';

export interface PluginConfigOpts {
  tailwindCssPath?: string;
  tailwindCssContents?: string;
  tailwindConf?: TailwindConfig;
  stripComments?: boolean;
  minify?: boolean;
  enablePurge?: boolean;
  purgeSafeList?: string[];
  purgeExtractor?: (content: string) => string[]
}

export interface PluginConfigOptsDefaults {
  DEFAULT: PluginConfigOpts
}

export interface PluginOptions extends PluginConfigOpts {
  debug?: boolean;
}

export const PluginOpts: PluginConfigOptsDefaults = Object.freeze(conf.PluginConfigDefaults);

function configureOptions(opts?: PluginOptions) {
  const options = Object.assign({}, { debug: false }, PluginOpts.DEFAULT, opts);

  conf.configurePluginOptions(options);
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
