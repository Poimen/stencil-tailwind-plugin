import postcssrc from 'postcss-load-config';
import cssnano from 'cssnano';
import combine from 'postcss-combine-duplicated-selectors';
import mediaCombine from 'postcss-combine-media-query';
import discardComments from 'postcss-discard-comments';

async function loadPlugins() {
  const ctx = { };

  try {
    const configPlugins = await postcssrc(ctx as unknown);
    return configPlugins.plugins;
  } catch (err) {
      if (err.message.startsWith('No PostCSS Config found in')) {
        return [];
      }

      throw new Error(
        `'stencil-tailwind-plugin' is not able to resolve modules required from configuration files. Make sure it is installed\nError: ${err.message}`,
      );
  }
}

function findIndexOfPlugin(configPlugins: postcssrc.ResultPlugin[], name: string) {
  return configPlugins.findIndex((plugin) => {
    if ('postcssPlugin' in plugin) {
      return plugin.postcssPlugin === name;
    }

    if (typeof plugin === 'function') {
      const createdPlugin = (plugin as typeof Function)();
      return 'postcssPlugin' in createdPlugin && createdPlugin.postcssPlugin === name;
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
    mediaCombine(),
    combine({ removeDuplicatedValues: true }),
    cssnano(),
  ];
}

export async function getPostcssPlugins(): Promise<PostcssPlugins> {
  const configPlugins = await loadPlugins();

  const configPluginTailwindIdx = findIndexOfPlugin(configPlugins, '@tailwindcss/postcss');

  const beforeTailwind = configPluginTailwindIdx === -1 ? [] : configPlugins.slice(0, configPluginTailwindIdx);
  const afterTailwind = configPluginTailwindIdx === -1 ? configPlugins : configPlugins.slice(configPluginTailwindIdx + 1);

  return {
    before: beforeTailwind,
    after: afterTailwind,
  };
}
