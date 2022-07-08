import { Plugin } from '@stencil/core/internal';
import { Config as TailwindConfig } from 'tailwindcss';
import { configurePluginOptions, PluginConfigDefaults } from './config/pluginConfiguration';
import { configureLogging } from './debug/logger';
import { transform, postTransformDependencyUpdate, buildStart, buildEnd } from './plugin';

export interface PostcssPlugin {
  plugins: any[];
}

export interface PluginConfigOpts {
  enableDebug?: boolean;
  tailwindCssPath?: string;
  tailwindCssContents?: string;
  tailwindConf?: TailwindConfig;
  stripComments?: boolean;
  minify?: boolean;
  postcss?: string | PostcssPlugin;
  useAutoPrefixer?: boolean;
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
    transform: transform,
    buildStart,
    buildEnd
  } as Plugin;
}

export function tailwindHMR(): Plugin {
  return {
    pluginType: 'css',
    name: 'tailwind-hmr',
    transform: postTransformDependencyUpdate,
    buildStart,
    buildEnd
  } as Plugin;
}
