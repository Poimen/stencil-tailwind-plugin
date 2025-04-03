import { AcceptedPlugin } from 'postcss';
import postcssrc from 'postcss-load-config';
import cssnano from 'cssnano';
import combine from 'postcss-combine-duplicated-selectors';
import discardComments from 'postcss-discard-comments';

import { debug } from '../debug/logger';
import { PluginConfigOpts, PostcssPlugin } from '..';

async function loadPlugins(postcssConf?: string | PostcssPlugin) {
  const ctx = { plugins: [] };
  let path = '';
  if (
    typeof postcssConf === 'object' &&
    !Array.isArray(postcssConf) &&
    postcssConf !== null &&
    Array.isArray(postcssConf.plugins)
  ) {
    return postcssConf.plugins;
  } else if (typeof postcssConf === 'string' || postcssConf instanceof String) {
    path = postcssConf as string;
  }

  try {
    const configPlugins = await postcssrc(ctx as unknown, path);
    return configPlugins.plugins;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `'stencil-tailwind-plugin' is not able to resolve modules required from configuration files. Make sure it is installed\nError: ${err.message}`,
      );
    }
    // No config file found, fallthrough to manually configuring postcss
    // fallthrough expected
    debug('[TW]', 'No postcss configuration file found in:', postcssConf);
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
  hasAutoPrefixer: boolean;
}

export function stripCommentsPlugin(): AcceptedPlugin {
  return discardComments({
    removeAll: true,
  });
}

export function getMinifyPlugins(): AcceptedPlugin[] {
  return [
    combine(),
    cssnano() as AcceptedPlugin,
  ];
}

export async function getPostcssPlugins(conf: PluginConfigOpts): Promise<PostcssPlugins> {
  const configPlugins = await loadPlugins(conf.postcss);

  const configPluginTailwindIdx = findIndexOfPlugin(configPlugins, 'tailwindcss');
  const hasAutoPrefixer = findIndexOfPlugin(configPlugins, 'autoprefixer') !== -1;

  const beforeTailwind = configPluginTailwindIdx === -1 ? [] : configPlugins.slice(0, configPluginTailwindIdx);
  const afterTailwind = configPluginTailwindIdx === -1 ? configPlugins : configPlugins.slice(configPluginTailwindIdx + 1);

  return {
    before: beforeTailwind,
    after: afterTailwind,
    hasAutoPrefixer,
  };
}
