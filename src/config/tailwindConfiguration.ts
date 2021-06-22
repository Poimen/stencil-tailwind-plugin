import path from 'path';
import fs from 'fs-extra';
import { TailwindConfig } from 'tailwindcss/tailwind-config';
import * as log from '../debug/logger';

let _tailwindCssContents: string;
let _tailwindConf: TailwindConfig;

export function makeTailwindConfig(purgeFileList: string[]): TailwindConfig {
  _tailwindConf.purge = purgeFileList;
  return _tailwindConf;
}

export function fetchTailwindDefaultCssConf(): string {
  return _tailwindCssContents;
}

function setDefaultTailwindCssContents(tailwindCssPath?: string) {
  const _defaultPackageTailwindCss = `
    @tailwind utilities;
    @tailwind components;
  `;

  if (tailwindCssPath) {
    _tailwindCssContents = fs.readFileSync(path.resolve(tailwindCssPath)).toString();

    if (_tailwindCssContents.length === 0) {
      log.warn('No css found when reading Tailwind configuration css - path', tailwindCssPath);
    }
  } else {
    _tailwindCssContents = _defaultPackageTailwindCss;
  }
}

function setDefaultTailwindConf(tailwindConf?: TailwindConfig) {
  if (tailwindConf) {
    _tailwindConf = tailwindConf;
  } else {
    const twConf = {
      mode: 'jit',
      purge: [],
      darkMode: false,
      plugins: []
    };
    // HACK! Current tailwind types don't have the 'jit' mode field so make the type
    // look as if it is meant to be there
    _tailwindConf = (twConf as unknown) as TailwindConfig;
  }
}

export function setupTailwindConfiguration(tailwindCssPath?: string, tailwindConf?: TailwindConfig) : void {
  setDefaultTailwindCssContents(tailwindCssPath);
  setDefaultTailwindConf(tailwindConf);
}

setDefaultTailwindConf();
setDefaultTailwindCssContents();
