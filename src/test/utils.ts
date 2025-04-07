import path from 'path';
import fs from 'fs-extra';

export interface TestFileLoader {
  text: string;
  path: string;
}

export function loadTestComponent(testBase: string, filename: string): TestFileLoader {
  const resolvedPath = path.resolve(path.join('src', 'test', testBase, 'files', filename));
  return {
    text: fs.readFileSync(resolvedPath).toString(),
    path: resolvedPath,
  };
}
