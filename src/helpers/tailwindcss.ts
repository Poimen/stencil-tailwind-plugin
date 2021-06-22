import path from 'path';
import fs from 'fs-extra';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import { makeTailwindConfig } from '../config/tailwind';

export async function processSourceTextForTailwindInlineClasses(fileName: string, sourceText?: string): Promise<string> {
  // TODO: this should be a config...
  const cssToProcess = sourceText ?? fs.readFileSync(path.resolve(path.join('src', 'config', 'app.css')));

  const twConf = makeTailwindConfig([fileName]);

  const postcssPlugins: AcceptedPlugin[] = [
    tailwindcss(twConf),
    cssnano() as AcceptedPlugin
  ];

  const result = await postcss(postcssPlugins).process(cssToProcess, { from: fileName });

  return result.css;
}
