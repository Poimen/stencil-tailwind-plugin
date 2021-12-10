import path from 'path';
import discardComments from 'postcss-discard-comments';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import combine from 'postcss-combine-duplicated-selectors';
import sortMediaQueries from 'postcss-sort-media-queries';
import atImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import postcssrc from 'postcss-load-config';
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

function getDefaultPostcssPlugins(conf: PluginConfigOpts, relativePath: string): AcceptedPlugin[] {
  const twConf = makeTailwindConfig([relativePath]);

  const postcssPlugins: AcceptedPlugin[] = [
    atImport(conf.atImportConf) as AcceptedPlugin,
    tailwindcss(twConf),
    autoprefixer(conf.autoprefixerOptions)
  ];

  if (conf.minify) {
    postcssPlugins.push(...getMinifyPlugins());
  }

  if (conf.stripComments) {
    postcssPlugins.push(stripCommentsPlugin());
  }

  return postcssPlugins;
}

async function tryGetPostcssUserConfig(conf: PluginConfigOpts) {
  const configPath = conf.postcssConfig ?? process.cwd();

  try {
    const config = await postcssrc(undefined, configPath);
    return config.plugins;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `'stencil-tailwind-plugin' is not able to resolve modules required from configuration files. Make sure it is installed\nError: ${err.message}`
      );
    }
    // No config file found, fallthrough to manually configuring postcss
    // fallthrough expected
    debug('[TW]', 'No postcss configuration file found in:', configPath);
  }
  return null;
}

async function getPostCssPlugins(conf: PluginConfigOpts, relativePath: string): Promise<AcceptedPlugin[]> {
  const config = await tryGetPostcssUserConfig(conf);

  if (config === null) {
    return getDefaultPostcssPlugins(conf, relativePath);
  }

  return config;
}

export async function processSourceTextForTailwindInlineClasses(filename: string, sourceText?: string): Promise<string> {
  const conf = getConfiguration();
  const cssToProcess = sourceText ?? conf.tailwindCssContents;

  const relativePath = path.join('.', path.relative(process.cwd(), filename));

  const postcssPlugins = await getPostCssPlugins(conf, relativePath);

  console.log(cssToProcess)
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
