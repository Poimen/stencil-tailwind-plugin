import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import { fetchTailwindDefaultCssConf, makeTailwindConfig } from '../config/tailwindConfiguration';

export async function processSourceTextForTailwindInlineClasses(fileName: string, sourceText?: string): Promise<string> {
  const cssToProcess = sourceText ?? fetchTailwindDefaultCssConf();

  const twConf = makeTailwindConfig([fileName]);

  const postcssPlugins: AcceptedPlugin[] = [
    tailwindcss(twConf),
    cssnano() as AcceptedPlugin
  ];

  const result = await postcss(postcssPlugins).process(cssToProcess, { from: fileName });

  return result.css;
}
