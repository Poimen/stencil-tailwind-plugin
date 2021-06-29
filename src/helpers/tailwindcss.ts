import discardComments from 'postcss-discard-comments';
import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import { fetchTailwindDefaultCssConf, makeTailwindConfig } from '../config/tailwindConfiguration';
import * as log from '../debug/logger';

export async function processSourceTextForTailwindInlineClasses(fileName: string, sourceText?: string): Promise<string> {
  const cssToProcess = sourceText ?? fetchTailwindDefaultCssConf();

  const twConf = makeTailwindConfig([fileName]);

  // Safe selector list not to purge
  const webComponentSpecificSafeSelectors = [
    ':root',
    ':host',
    ':shadow',
    '/deep/',
    '::part',
    '::theme'
  ];

  const postcssPlugins: AcceptedPlugin[] = [
    tailwindcss(twConf),
    purgecss({
      content: [fileName],
      safelist: webComponentSpecificSafeSelectors
    }),
    discardComments({
      removeAll: true
    }),
    cssnano() as AcceptedPlugin
  ];

  const result = await postcss(postcssPlugins).process(cssToProcess, { from: fileName });

  // Tailwind JIT syntax needs to escape the '#', '[', ']', etc. in the css output. When writing
  // the escaped characters, the tailwind escaping is lost as the string output doesn't keep the
  // escaping as it doesn't know that they should be escaped in css.
  //
  // This replacement ensures the escaped characters from tailwind are kept escaped so the ending css
  // is correct when applied to styles in css.
  const css = result.css.replace(/\\/g, '\\\\');

  log.debug('[TW]', 'Tailwind styles:', css);

  return css;
}
