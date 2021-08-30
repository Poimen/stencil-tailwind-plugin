import path from 'path';
import discardComments from 'postcss-discard-comments';
import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import combine from 'postcss-combine-duplicated-selectors';
import sortMediaQueries from 'postcss-sort-media-queries';
import atImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import { makeTailwindConfig, getConfiguration } from '../config/pluginConfiguration';
import { debug } from '../debug/logger';
import { PluginConfigOpts } from '../index';

function stripCommentsPlugin() {
  return discardComments({
    removeAll: true
  });
}

function getMinifyPlugins(): AcceptedPlugin[] {
  return [
    sortMediaQueries(),
    combine(),
    cssnano() as AcceptedPlugin
  ];
}

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

function getPostCssPlugins(conf: PluginConfigOpts, relativePath: string, allowPurge: boolean): AcceptedPlugin[] {
  const twConf = makeTailwindConfig([relativePath]);

  const postcssPlugins: AcceptedPlugin[] = [
    atImport(conf.atImportConf) as AcceptedPlugin,
    autoprefixer(conf.autoprefixerOptions),
    tailwindcss(twConf)
  ];

  if (allowPurge && conf.enablePurge) {
    postcssPlugins.push(purgecss({
      content: [relativePath],
      safelist: conf.purgeSafeList,
      defaultExtractor: conf.purgeExtractor
    }));
  }

  if (conf.minify) {
    postcssPlugins.push(...getMinifyPlugins());
  }

  if (conf.stripComments) {
    postcssPlugins.push(stripCommentsPlugin());
  }

  return postcssPlugins;
}

export async function processSourceTextForTailwindInlineClasses(filename: string, allowPurge: boolean, sourceText?: string): Promise<string> {
  const conf = getConfiguration();
  const cssToProcess = sourceText ?? conf.tailwindCssContents;

  const relativePath = path.join('.', path.relative(process.cwd(), filename));

  const postcssPlugins = getPostCssPlugins(conf, relativePath, allowPurge);

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
