import { Plugin } from '@stencil/core/internal';
import { Config } from 'tailwindcss';
import { configurePluginOptions, PluginConfigDefaults } from './config/pluginConfiguration';
import { configureLogging } from './debug/logger';
import { configuredTransform, postTransformDependencyUpdate, buildStart, buildEnd, processGlobalStyles } from './plugin';

export interface PostcssPlugin {
  plugins: any[];
}

export type TailwindConfig = Config;
export type TailwindPluginFunctionalConfig = ((filename: string, config: TailwindConfig) => TailwindConfig);
export type TailwindPluginConfig = TailwindConfig | TailwindPluginFunctionalConfig;

export interface PluginConfigOpts {
  enableDebug?: boolean;
  tailwindCssPath?: string;
  tailwindCssContents?: string;
  tailwindConf?: TailwindPluginConfig;
  stripComments?: boolean;
  minify?: boolean;
  postcss?: string | PostcssPlugin;
  useAutoPrefixer?: boolean;
}

export interface PluginConfigOptsDefaults {
  DEFAULT: PluginConfigOpts;
}

export const PluginOpts: PluginConfigOptsDefaults = Object.freeze(PluginConfigDefaults);

let pluginAppliedConfiguration: PluginConfigOpts = PluginOpts.DEFAULT;

function configureOptions(opts?: PluginConfigOpts) {
  const options = {
    ...pluginAppliedConfiguration,
    ...opts,
  };

  const config = configurePluginOptions(options);
  configureLogging(options.enableDebug);

  return config;
}

export default function tailwindPlugin(opts?: PluginConfigOpts): Plugin {
  const config = configureOptions(opts);

  return {
    name: 'tailwind',
    transform: configuredTransform(config),
    buildStart,
    buildEnd,
  } as Plugin;
}

export function setPluginConfigurationDefaults(opts: PluginConfigOpts): PluginConfigOpts {
  pluginAppliedConfiguration = {
    ...pluginAppliedConfiguration,
    ...opts,
  };

  return pluginAppliedConfiguration;
}

export function tailwindHMR(opts?: PluginConfigOpts): Plugin {
  const config = configureOptions(opts);

  return {
    pluginType: 'css',
    name: 'tailwind-hmr',
    transform: postTransformDependencyUpdate(config),
    buildStart,
    buildEnd,
  } as Plugin;
}

export function tailwindGlobal(opts?: PluginConfigOpts): Plugin {
  const config = configureOptions(opts);

  return {
    pluginType: 'css',
    name: 'tailwind-global',
    transform: processGlobalStyles(config),
    buildStart,
    buildEnd,
  } as Plugin;
}
