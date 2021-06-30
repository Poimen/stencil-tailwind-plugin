import path from 'path';
import discardComments from 'postcss-discard-comments';
import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import * as twConfig from '../config/pluginConfiguration';
import * as log from '../debug/logger';

// function getPurgeConfiguration() {
//   const webComponentSpecificSafeSelectors = [
//     ':root',
//     ':host',
//     ':shadow',
//     '/deep/',
//     '::part',
//     '::theme'
//   ];

// }

export async function processSourceTextForTailwindInlineClasses(filename: string, sourceText?: string): Promise<string> {
  const conf = twConfig.getConfiguration();
  const cssToProcess = sourceText ?? conf.tailwindCssContents;

  const relativePath = path.join('.', path.relative(process.cwd(), filename));
  const twConf = twConfig.makeTailwindConfig([relativePath]);

  // const postcssPlugins = [
  //   tailwindcss(twConf)
  // ];

  // Safe selector list not to purge

  const postcssPlugins: AcceptedPlugin[] = [
    tailwindcss(twConf),
    purgecss({
      content: [relativePath],
      safelist: conf.purgeSafeList,
      defaultExtractor: conf.purgeExtractor
    }),
    cssnano() as AcceptedPlugin
  ];

  if (conf.stripComments) {
    postcssPlugins.push(
      discardComments({
        removeAll: true
      })
    );
  }

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
