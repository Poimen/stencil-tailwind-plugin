import path from 'path';
import discardComments from 'postcss-discard-comments';
import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import * as pluginConf from '../config/pluginConfiguration';
import * as log from '../debug/logger';

function getPostCssPlugins(conf: pluginConf.PluginConfigOpts, relativePath: string, allowPurge: boolean): AcceptedPlugin[] {
  const twConf = pluginConf.makeTailwindConfig([relativePath]);

  const postcssPlugins: AcceptedPlugin[] = [
    tailwindcss(twConf)
  ];

  if (allowPurge && conf.purgeEnable) {
    postcssPlugins.push(purgecss({
      content: [relativePath],
      safelist: conf.purgeSafeList,
      defaultExtractor: conf.purgeExtractor
    }));
  }

  if (conf.minify) {
    postcssPlugins.push(cssnano() as AcceptedPlugin);
  }

  if (conf.stripComments) {
    postcssPlugins.push(
      discardComments({
        removeAll: true
      })
    );
  }

  return postcssPlugins;
}

export async function processSourceTextForTailwindInlineClasses(filename: string, allowPurge: boolean, sourceText?: string): Promise<string> {
  const conf = pluginConf.getConfiguration();
  const cssToProcess = sourceText ?? conf.tailwindCssContents;

  const relativePath = path.join('.', path.relative(process.cwd(), filename));

  const postcssPlugins = getPostCssPlugins(conf, relativePath, allowPurge);

  const result = await postcss(postcssPlugins).process(cssToProcess, { from: relativePath });

  // Tailwind JIT syntax needs to escape the '#', '[', ']', etc. in the css output. When writing
  // the escaped characters, the tailwind escaping is lost as the string output doesn't keep the
  // escaping as it doesn't know that they should be escaped in css.
  //
  // This replacement ensures the escaped characters from tailwind are kept escaped so the ending css
  // is correct when applied to styles in css.
  let css = result.css.replace(/\\/g, '\\\\');

  if (conf.stripComments) {
    // For whatever reason discard comments leaves blocks of `/*!*/ /*!*/` in the code, but removes other comments - post strip these if required
    css = result.css.replace(/\/\*!\*\/ \/\*!\*\//g, '');
  }

  log.debug('[TW]', 'Tailwind styles:', css);

  return css;
}
