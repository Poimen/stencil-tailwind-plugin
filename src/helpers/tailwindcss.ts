import path from 'path';
import postcss, { AcceptedPlugin } from 'postcss';
import autoprefixer from 'autoprefixer';
import tailwind from 'tailwindcss/lib/processTailwindFeatures'; // yeah, not great but there are mtimeMS detections that fail without reaching into the context directly
import resolveConfig from 'tailwindcss/lib/public/resolve-config';
import { getConfiguration, makeTailwindConfig } from '../config/pluginConfiguration';
import { debug } from '../debug/logger';
import { getMinifyPlugins, getPostcssPlugins, stripCommentsPlugin } from './postcss';

function makeTailwindPlugin(config: any, changedContent: { content: string, extension: string }) {
  const plugin = () => {
    return {
      postcssPlugin: 'tailwindcss',
      Once(root, { result }) {
        tailwind(({ createContext }) => {
          return () => {
            return createContext(resolveConfig(config), [changedContent]);
          };
        })(root, result);
      }
    };
  };

  plugin.postcss = true;
  return plugin;
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

async function getPostcssPluginsWithTailwind(filenamePath: string, content: string, includePreflight: boolean): Promise<AcceptedPlugin[]> {
  const conf = getConfiguration();
  const twConf = makeTailwindConfig([filenamePath], includePreflight);

  // Get all the user plugins if there are any
  const { before, after, hasAutoPrefixer } = await getPostcssPlugins();

  const tailwindPlugin = makeTailwindPlugin(twConf, {
    content, extension: 'tsx'
  });

  const plugins: any = [
    ...before,
    tailwindPlugin,
    ...after
  ];

  if (conf.useAutoPrefixer && !hasAutoPrefixer) {
    plugins.push(autoprefixer());
  }

  if (conf.minify) {
    plugins.push(...getMinifyPlugins());
  }

  if (conf.stripComments) {
    plugins.push(stripCommentsPlugin());
  }

  return plugins;
}

async function processTailwindPostcss(includePreflight: boolean, filename: string, sourceTsx: string, sourceCss?: string) {
  const conf = getConfiguration();
  const cssToProcess = `${conf.tailwindCssContents} ${sourceCss ?? ''}`;

  const postcssPlugins = await getPostcssPluginsWithTailwind(filename, sourceTsx, includePreflight);

  const result = await postcss(postcssPlugins).process(cssToProcess, { from: filename });

  const css = applyRawEscaping(result.css, conf.minify);

  debug('[TW]', 'Tailwind styles:', css);

  return css;
}

export function processSourceTextForTailwindInlineClassesWithoutPreflight(filename: string, sourceTsx: string, sourceCss?: string): Promise<string> {
  return processTailwindPostcss(false, filename, sourceTsx, sourceCss);
}

export function processSourceTextForTailwindInlineClasses(filename: string, sourceTsx: string, sourceCss?: string): Promise<string> {
  return processTailwindPostcss(true, filename, sourceTsx, sourceCss);
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
