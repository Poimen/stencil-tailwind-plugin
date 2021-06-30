import { TransformResult } from 'rollup';
import * as log from './debug/logger';
import { transform as styleSheetTransform } from './processors/stylesheets';
import { transform as typescriptTransform } from './processors/typescript';

export function buildStart(): void {
  log.debug('Starting build');
}

export function buildEnd(err?: Error): void {
  if (err) {
    log.error('Something went wrong!', err.message);
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

export async function transform(code: string, id: string): Promise<TransformResult> {
  let codeResult = code;
  if (useStyleSheetTransform(id)) {
    codeResult = await styleSheetTransform(code, id);
  } else if (useTypescriptXTransform(id)) {
    codeResult = await typescriptTransform(code, id);
  }

  return {
    code: codeResult,
    map: null
  };
}
