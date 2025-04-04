import path from 'path';
import postcss, { AcceptedPlugin } from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';
import { debug } from '../debug/logger';
import { getMinifyPlugins, getPostcssPlugins, stripCommentsPlugin } from './postcss';
import { PluginConfigurationOptions } from '..';

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

function buildTailwindConfigurationForPostCss(configuration: PluginConfigurationOptions, filePath: string) {
  let optimizeOptions = {};

  if (configuration.minify) {
    optimizeOptions = {
      optimize: { minify: true },
    };
  } else if (configuration.optimise) {
    optimizeOptions = {
      optimize: true,
    };
  }

  return {
    ...optimizeOptions,
    base: path.parse(filePath).dir,
  };
}

// async function getPostcssPluginsWithTailwind(conf: PluginConfigurationOptions, filenamePath: string, content: string, includePreflight: boolean): Promise<AcceptedPlugin[]> {
async function getPostcssPluginsWithTailwind(configuration: PluginConfigurationOptions, filePath: string) {
  // const twConf = resolveTailwindConfigurationFromUserSettings(conf.tailwindConf, [filenamePath], includePreflight);

  // Get all the user plugins if there are any
  const { before, after } = await getPostcssPlugins(configuration);

  // const tailwindPlugin = makeTailwindPlugin(twConf, {
  //   content, extension: 'tsx',
  // });

  const tailwindPluginConfiguration = buildTailwindConfigurationForPostCss(configuration, filePath);

  const plugins: AcceptedPlugin[] = [
    ...before,
    tailwindPostcss(tailwindPluginConfiguration),
    ...after,
  ];

  if (configuration.stripComments) {
    plugins.push(stripCommentsPlugin());
  }

  return plugins;
}

// const twConfigCss = `
// @import "tailwindcss";
// `;
// const twConfigCss = `
// @layer theme, base, components, utilities;

// @import "tailwindcss/theme.css" layer(theme);
// @import "tailwindcss/utilities.css" layer(utilities);
// `;

// async function processTailwindPostcss(conf: PluginConfigurationOptions, includePreflight: boolean, filename: string, sourceTsx: string, sourceCss?: string) {
async function processTailwindPostcss(configuration: PluginConfigurationOptions, filename: string, sourceTsx: string, sourceCss?: string) {
  const tailwindCssConfiguration = configuration.injectTailwindConfiguration(filename);
  // resolveTailwindConfigurationFromUserSettings(configuration.injectTailwindConfiguration, [filename]);

  // const cssToProcess = `${conf.tailwindCssContents} ${sourceCss ?? ''}`;
  const cssToProcess = `${tailwindCssConfiguration} ${sourceCss ?? ''}`;
  // const cssToProcess = sourceCss ?? '';

  const postcssPlugins = await getPostcssPluginsWithTailwind(configuration, filename);
  // const postcssPlugins = await getPostcssPluginsWithTailwind(conf, filename, sourceTsx, includePreflight);

  // const postcssPreprocessor = postcss(postcssPlugins);

  // const twPreflight = await postcssPreprocessor.process(twConfigCss, { from: filename });
  // debug('[TW]', 'twPreflight', twPreflight);
  debug('[TW]', 'cssToProcess', cssToProcess);

  const result = await postcss(postcssPlugins).process(cssToProcess, { from: filename });

  const css = applyRawEscaping(result.css, configuration.minify);

  // debug('[TW]', 'Tailwind styles:', css);

  return css;
}

// export function processSourceTextForTailwindInlineClassesWithoutPreflight(opts: PluginConfigOpts, filename: string, sourceTsx: string, sourceCss?: string): Promise<string> {
//   return processTailwindPostcss(opts, false, filename, sourceTsx, sourceCss);
// }

export function processSourceTextForTailwindInlineClasses(opts: PluginConfigurationOptions, filename: string, sourceTsx: string, sourceCss?: string): Promise<string> {
  return processTailwindPostcss(opts, filename, sourceTsx, sourceCss);
}

export async function reduceDuplicatedClassesFromFunctionalComponentInjection(opts: PluginConfigurationOptions, filename: string, componentCss: string, injectCss: string): Promise<string> {
  // const { minify } = opts;
  const cssToProcess = componentCss + injectCss;

  // if (!minify || injectCss.length === 0) {
  //   return cssToProcess;
  // }

  const relativePath = path.join('.', path.relative(process.cwd(), filename));

  const postcssPlugins = getMinifyPlugins();

  if (opts.stripComments) {
    postcssPlugins.push(stripCommentsPlugin());
  }
  const result = await postcss(postcssPlugins).process(cssToProcess, { from: relativePath });
  // const result = await postcss([tailwindPostcss()]).process(cssToProcess, { from: relativePath });

  return result.css;
}

export function makeDefaultTailwindConf() {
  return () => '@import "tailwindcss";';
}
