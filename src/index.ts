import { configurePluginOptions, PluginConfigDefaults } from './config/pluginConfiguration';
import { configureLogging } from './debug/logger';
import { configuredTransform, postTransformDependencyUpdate, buildStart, buildEnd, processGlobalStyles } from './plugin';

export type TailwindConfig = string;
export type TailwindPluginFunctionalConfig = (filename: string) => TailwindConfig;
export type TailwindPluginConfig = TailwindPluginFunctionalConfig;

export interface PluginConfigurationOptions {
  enableDebug?: boolean;
  tailwindCssPath?: string;
  injectTailwindConfiguration?: TailwindPluginConfig;
  stripComments?: boolean;
  minify?: boolean;
  optimise?: boolean;
}

export interface PluginConfigOptionsDefaults {
  DEFAULT: PluginConfigurationOptions;
}

export const PluginOptions = Object.freeze(PluginConfigDefaults);

let globalPluginConfigurationOptions = PluginOptions.DEFAULT;

function configureOptions(opts?: PluginConfigurationOptions) {
  const options = {
    ...globalPluginConfigurationOptions,
    ...opts,
  };

  const config = configurePluginOptions(options);
  configureLogging(options.enableDebug);

  return config;
}

export function setPluginConfigurationDefaults(opts: PluginConfigurationOptions): PluginConfigurationOptions {
  globalPluginConfigurationOptions = {
    ...globalPluginConfigurationOptions,
    ...opts,
  };

  return globalPluginConfigurationOptions;
}

export default function tailwindPlugin(opts?: PluginConfigurationOptions) {
  const config = configureOptions(opts);

  return {
    name: 'tailwind',
    transform: configuredTransform(config),
    buildStart,
    buildEnd,
  };
}

export function tailwindHMR(opts?: PluginConfigurationOptions) {
  const config = configureOptions(opts);

  return {
    pluginType: 'css',
    name: 'tailwind-hmr',
    transform: postTransformDependencyUpdate(config),
    buildStart,
    buildEnd,
  };
}

export function tailwindGlobal(opts?: PluginConfigurationOptions) {
  const config = configureOptions(opts);

  return {
    pluginType: 'css',
    name: 'tailwind-global',
    transform: processGlobalStyles(config),
    buildStart,
    buildEnd,
  };
}
