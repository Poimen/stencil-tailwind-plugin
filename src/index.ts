import { Plugin } from 'rollup';
import { AtImportOptions } from 'postcss-import';
import autoprefixer from 'autoprefixer';
import { TailwindConfig } from 'tailwindcss/tailwind-config';
import { configurePluginOptions, PluginConfigDefaults } from './config/pluginConfiguration';
import { configureLogging } from './debug/logger';
import { buildStart, transform, buildEnd } from './plugin';

export interface PluginConfigOpts {
  enableDebug?: boolean;
  tailwindCssPath?: string;
  tailwindCssContents?: string;
  tailwindConf?: TailwindConfig;
  stripComments?: boolean;
  minify?: boolean;
  enablePurge?: boolean;
  purgeSafeList?: string[];
  purgeExtractor?: (content: string) => string[],
  atImportConf?: AtImportOptions;
  autoprefixerOptions?: autoprefixer.Options;
}

export interface PluginConfigOptsDefaults {
  DEFAULT: PluginConfigOpts
}

export const PluginOpts: PluginConfigOptsDefaults = Object.freeze(PluginConfigDefaults);

function configureOptions(opts?: PluginConfigOpts) {
  const options = Object.assign({}, PluginOpts.DEFAULT, opts);

  configurePluginOptions(options);
  configureLogging(options.enableDebug);
}

export default function tailwindPlugin(opts?: PluginConfigOpts): Plugin {
  configureOptions(opts);

  return {
    name: 'tailwind',
    buildStart: buildStart,
    transform: transform,
    buildEnd: buildEnd
  };
}
