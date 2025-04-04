import postcssrc from 'postcss-load-config';
import cssnano from 'cssnano';
import combine from 'postcss-combine-duplicated-selectors';
import discardComments from 'postcss-discard-comments';
import { debug } from '../debug/logger';
import { PluginConfigurationOptions } from '..';

async function loadPlugins(postcssPathConfiguration?: string) {
  const ctx = { plugins: [] };

  try {
    const configPlugins = await postcssrc(ctx as unknown, postcssPathConfiguration);
    return configPlugins.plugins;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `'stencil-tailwind-plugin' is not able to resolve modules required from configuration files. Make sure it is installed\nError: ${err.message}`,
      );
    }
    // No config file found, fallthrough to manually configuring postcss
    // fallthrough expected
    debug('[TW]', 'No postcss configuration file found in:', postcssPathConfiguration);
  }

  return [];
}

function findIndexOfPlugin(configPlugins: postcssrc.ResultPlugin[], name: string) {
  return configPlugins.findIndex((plugin) => {
    if (typeof plugin === 'function' && plugin.name === name) {
      return true;
    }

    if (typeof plugin === 'object' && plugin !== null && (plugin['postcssPlugin'] === name || plugin['name'] === name)) {
      return true;
    }

    return false;
  });
}

interface PostcssPlugins {
  before: postcssrc.ResultPlugin[];
  after: postcssrc.ResultPlugin[];
}

export function stripCommentsPlugin() {
  return discardComments({
    removeAll: true,
  });
}

export function getMinifyPlugins() {
  return [
    combine(),
    cssnano(),
  ];
}

export async function getPostcssPlugins(conf: PluginConfigurationOptions): Promise<PostcssPlugins> {
  const configPlugins = await loadPlugins(conf.postcssPath);

  const configPluginTailwindIdx = findIndexOfPlugin(configPlugins, 'tailwindcss');

  const beforeTailwind = configPluginTailwindIdx === -1 ? [] : configPlugins.slice(0, configPluginTailwindIdx);
  const afterTailwind = configPluginTailwindIdx === -1 ? configPlugins : configPlugins.slice(configPluginTailwindIdx + 1);

  return {
    before: beforeTailwind,
    after: afterTailwind,
  };
}
