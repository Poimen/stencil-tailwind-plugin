import path from 'path';
import PQueue from 'p-queue';
import { debug, error } from './debug/logger';
import { transform as styleSheetTransform } from './processors/stylesheets';
import { transform as typescriptTransform } from './processors/typescript';
import { PluginCtx, PluginTransformResults } from '@stencil/core/internal';
import { getAllExternalCssDependencies } from './store/store';
import { PluginConfigOpts } from '.';
import { processSourceTextForTailwindInlineClasses } from './helpers/tailwindcss';

export function buildStart(): void {
  debug('Starting build');
}

export function buildEnd(err?: Error): void {
  if (err) {
    error('Oh noes! Something went wrong!', err.message);
    error(err.stack);
  }
  debug('Build completed');
}

function useStyleSheetTransform(filename: string) {
  return filename.match(/\.s?(a|c)ss/);
}

function useTypescriptTransform(filename: string) {
  return filename.match(/\.tsx/);
}

// The build order calls the transform function before the previous transform has completed
// For functional components we have a race between completing the tsx transform and the css
// transform. Hence queue the requests until we are ready for the next file to be processed
const queue = new PQueue({ concurrency: 1 });

export function configuredTransform(opts: PluginConfigOpts): (code: string, id: string) => Promise<PluginTransformResults> {
  const tsTransformer = typescriptTransform(opts);
  const cssTransformer = styleSheetTransform(opts);

  return async (code: string, id: string): Promise<PluginTransformResults> => {
    return await queue.add(async () => {
      let codeResult = code;
      if (useStyleSheetTransform(id)) {
        codeResult = await cssTransformer(code, id);
      } else if (useTypescriptTransform(id)) {
        codeResult = await tsTransformer(code, id);
      }

      return {
        code: codeResult,
        map: null
      };
    });
  };
}

export async function postTransformDependencyUpdate(code: string, id: string): Promise<PluginTransformResults> {
  return await queue.add(async () => {
    const deps = getAllExternalCssDependencies(id);
    const finalCss = deps.css === '' ? code : `${code} ${deps.css}`;

    return {
      code: finalCss,
      map: null,
      dependencies: deps.dependencies
    };
  });
}

export function processGlobalStyles(opts: PluginConfigOpts) {
  return async (code: string, id: string, context: PluginCtx): Promise<PluginTransformResults> => {
    if (!context.config.globalStyle) {
      return {
        code, map: null
      };
    }

    // The global style extension is replaced with css if there is a sass preprocessor involved
    // Hence need to match the id of the file that is being processed with the expected global style
    // file. This is not 100% accurate but should be close enough.
    const file = path.parse(context.config.globalStyle);
    const regex = new RegExp(`${file.dir}.${file.name}.s?(a|c)ss`);
    if (!id.match(regex)) {
      return {
        code, map: null
      };
    }

    return await queue.add(async () => {
      // Note: usage of `code` for sourceTsx is more to avoid the TS warning about no utilities found
      // in the source. Technically should be an empty string, but seeing the css and tsx are the same
      // there should be no extra classes generated
      const newGlobalCss = await processSourceTextForTailwindInlineClasses(opts, id, code, code);

      return {
        code: newGlobalCss,
        map: null,
        dependencies: [context.config.globalStyle, id]
      };
    });
  };
}
