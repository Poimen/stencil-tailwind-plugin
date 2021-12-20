import path from 'path';
import postcss from 'postcss';
import { getConfiguration } from '../config/pluginConfiguration';
import { debug } from '../debug/logger';
import { getMinifyPlugins, getPostcssPluginsWithTailwind, stripCommentsPlugin } from './postcss';

function applyRawEscaping(css: string, wasMinified: boolean): string {
  if (wasMinified) {
    // cssnano would have escaped most things...
    return css;
  }

  // cssnano was not run, do some basic escaping
  return css
    .replace(/\n/g, '')
    .replace(/'/g, '"')
    .replace(/`/g, '\\`')
    .replace(/\t/g, ' ');
}

export async function processSourceTextForTailwindInlineClasses(filename: string, sourceText?: string): Promise<string> {
  const conf = getConfiguration();
  const cssToProcess = `${conf.tailwindCssContents} ${sourceText ?? ''}`;

  const relativePath = path.join('.', path.relative(process.cwd(), filename));

  const postcssPlugins = await getPostcssPluginsWithTailwind(relativePath);

  const result = await postcss(postcssPlugins).process(cssToProcess, { from: relativePath });

  const css = applyRawEscaping(result.css, conf.minify);

  debug('[TW]', 'Tailwind styles:', css);

  return css;
}

export async function reduceDuplicatedClassesFromFunctionalComponentInjection(filename: string, componentCss: string, injectCss: string): Promise<string> {
  const { minify, stripComments } = getConfiguration();
  const cssToProcess = componentCss + injectCss;

  if (!minify || injectCss.length === 0) {
    return cssToProcess;
  }

  const relativePath = path.join('.', path.relative(process.cwd(), filename));

  const postcssPlugins = getMinifyPlugins();

  if (stripComments) {
    postcssPlugins.push(stripCommentsPlugin());
  }
  const result = await postcss(postcssPlugins).process(cssToProcess, { from: relativePath });

  return result.css;
}
