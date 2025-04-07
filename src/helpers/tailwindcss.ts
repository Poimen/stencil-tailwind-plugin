import path from 'path';
import postcss, { AcceptedPlugin } from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';
import { debug } from '../debug/logger';
import { getMinifyPlugins, getPostcssPlugins, stripCommentsPlugin } from './postcss';
import { PluginConfigurationOptions } from '..';

function applyRawEscaping(css: string) {
  return css
    .replace(/\n/g, '')
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

async function getPostcssPluginsWithTailwind(configuration: PluginConfigurationOptions, filePath: string) {
  // Get all the user plugins if there are any
  const { before, after } = await getPostcssPlugins();

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

async function processTailwindPostcss(configuration: PluginConfigurationOptions, filename: string, sourceCss?: string) {
  const tailwindCssConfiguration = configuration.injectTailwindConfiguration(filename);

  const cssToProcess = `${tailwindCssConfiguration} ${sourceCss ?? ''}`;

  const postcssPlugins = await getPostcssPluginsWithTailwind(configuration, filename);

  const result = await postcss(postcssPlugins).process(cssToProcess, { from: filename });

  const css = applyRawEscaping(result.css);

  debug('[TW]', 'Tailwind styles:', css);

  return css;
}

export function processSourceTextForTailwindInlineClasses(opts: PluginConfigurationOptions, filename: string, sourceCss?: string) {
  return processTailwindPostcss(opts, filename, sourceCss);
}

export async function reduceDuplicatedClassesFromFunctionalComponentInjection(opts: PluginConfigurationOptions, filename: string, componentCss: string, injectCss: string) {
  const cssToProcess = `${injectCss}${componentCss}`;

  const relativePath = path.join('.', path.relative(process.cwd(), filename));

  const postcssPlugins = getMinifyPlugins();

  if (opts.stripComments) {
    postcssPlugins.push(stripCommentsPlugin());
  }
  const result = await postcss(postcssPlugins).process(cssToProcess, { from: relativePath });

  return result.css;
}

export function makeDefaultTailwindConf() {
  return () => '@import "tailwindcss";';
}
