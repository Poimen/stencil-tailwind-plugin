import { Plugin } from 'rollup';
import * as conf from './config/pluginConfiguration';
import { configureLogging } from './debug/logger';
import * as plugin from './plugin';

export interface PluginOptions extends conf.PluginConfigOpts {
  debug?: boolean;
}

export const StencilTailwindPluginDefaults = Object.freeze(conf.PluginConfigOpts.DEFAULT);

function configureOptions(opts?: PluginOptions) {
  const options = Object.assign({}, { debug: false }, StencilTailwindPluginDefaults, opts);

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
