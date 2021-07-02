import { TransformResult } from 'rollup';
import PQueue from 'p-queue';
import * as log from './debug/logger';
import { transform as styleSheetTransform } from './processors/stylesheets';
import { transform as typescriptTransform } from './processors/typescript';

export function buildStart(): void {
  log.debug('Starting build');
}

export function buildEnd(err?: Error): void {
  if (err) {
    log.error('Oh noes! Something went wrong!', err.message);
    log.error(err.stack);
  }
  log.debug('Build completed');
}

function useStyleSheetTransform(filename: string) {
  return filename.match(/\.s?css/);
}

function useTypescriptXTransform(filename: string) {
  return filename.match(/\.tsx/);
}

// The build order calls the transform function before the previous transform has completed
// For functional components we have a race between completing the tsx transform and the css
// transform. Hence queue the requests until we are ready for the next file to be processed
const queue = new PQueue({ concurrency: 1 });

export async function transform(code: string, id: string): Promise<TransformResult> {
  let codeResult = code;
  if (useStyleSheetTransform(id)) {
    codeResult = await queue.add(() => styleSheetTransform(code, id));
  } else if (useTypescriptXTransform(id)) {
    codeResult = await queue.add(() => typescriptTransform(code, id));
  }

  return {
    code: codeResult,
    map: null
  };
}
