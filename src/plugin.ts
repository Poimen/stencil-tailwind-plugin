import PQueue from 'p-queue';
import { debug, error } from './debug/logger';
import { transform as styleSheetTransform } from './processors/stylesheets';
import { transform as typescriptTransform } from './processors/typescript';
import { PluginTransformResults } from '@stencil/core/internal';
import { getAllExternalCssDependencies } from './store/store';

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
  return filename.match(/\.s?css/);
}

function useTypescriptTransform(filename: string) {
  return filename.match(/\.tsx/);
}

// The build order calls the transform function before the previous transform has completed
// For functional components we have a race between completing the tsx transform and the css
// transform. Hence queue the requests until we are ready for the next file to be processed
const queue = new PQueue({ concurrency: 1 });

export async function transform(code: string, id: string): Promise<PluginTransformResults> {
  return await queue.add(async () => {
    let codeResult = code;
    if (useStyleSheetTransform(id)) {
      codeResult = await styleSheetTransform(code, id);
    } else if (useTypescriptTransform(id)) {
      codeResult = await typescriptTransform(code, id);
    }
    return {
      code: codeResult,
      map: null
    };
  });
}

// export async function postTransformDependencyUpdate(code: string, id: string, context: PluginCtx): Promise<PluginTransformResults> {
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
