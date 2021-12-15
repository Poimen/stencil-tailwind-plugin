import { getConfiguration, makeTailwindConfig } from '../config/pluginConfiguration';
import { AcceptedPlugin } from 'postcss';
import postcssrc from 'postcss-load-config';
import tailwind from 'tailwindcss';
import cssnano from 'cssnano';
import combine from 'postcss-combine-duplicated-selectors';
import sortMediaQueries from 'postcss-sort-media-queries';
import discardComments from 'postcss-discard-comments';
import { debug } from '../debug/logger';

async function loadConfiguration(postcssDir?: string) {
  if (postcssDir) {
    try {
      const configPlugins = await postcssrc(undefined, postcssDir);
      return configPlugins.plugins;
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        throw new Error(
          `'stencil-tailwind-plugin' is not able to resolve modules required from configuration files. Make sure it is installed\nError: ${err.message}`
        );
      }
      // No config file found, fallthrough to manually configuring postcss
      // fallthrough expected
      debug('[TW]', 'No postcss configuration file found in:', postcssDir);
    }
  }

  return [];
}

export interface PostcssPlugins {
  before: postcssrc.ResultPlugin[];
  after: postcssrc.ResultPlugin[];
}

export function stripCommentsPlugin(): AcceptedPlugin {
  return discardComments({
    removeAll: true
  });
}

export function getMinifyPlugins(): AcceptedPlugin[] {
  return [
    sortMediaQueries(),
    combine(),
    cssnano() as AcceptedPlugin
  ];
}

export async function getPostcssPlugins(): Promise<PostcssPlugins> {
  const conf = getConfiguration();
  const configPlugins = await loadConfiguration(conf.postcssConfig);

  const configPluginTailwindIdx = configPlugins.findIndex(plugin => {
    if (typeof plugin === 'function' && plugin.name === 'tailwindcss') {
      return true;
    }

    // eslint-disable-next-line dot-notation
    if (typeof plugin === 'object' && plugin !== null && plugin['postcssPlugin'] === 'tailwindcss') {
      return true;
    }

    return false;
  });

  const beforeTailwind = configPluginTailwindIdx === -1 ? [] : configPlugins.slice(0, configPluginTailwindIdx);
  const afterTailwind = configPluginTailwindIdx === -1 ? configPlugins : configPlugins.slice(configPluginTailwindIdx + 1);

  return {
    before: beforeTailwind,
    after: afterTailwind
  };
}

export async function getPostcssPluginsWithTailwind(relativePath: string): Promise<AcceptedPlugin[]> {
  const conf = getConfiguration();
  const twConf = makeTailwindConfig([relativePath]);

  // Get all the user plugins if there are any
  const { before, after } = await getPostcssPlugins();

  const plugins: AcceptedPlugin[] = [
    ...before,
    tailwind(twConf),
    ...after
  ];

  if (conf.minify) {
    plugins.push(...getMinifyPlugins());
  }

  if (conf.stripComments) {
    plugins.push(stripCommentsPlugin());
  }

  return plugins;
}
