import path from 'path';
import { debug } from '../debug/logger';

interface CssFileReference {
  css: string;
  name: string;
}
interface CssFileMap {
  [key: string]: CssFileReference;
}

interface ImportFileReference {
  imports: string[];
  cssFiles: CssFileMap;
  name: string;
}

export interface CssDependencies {
  css: string;
  dependencies: string[];
}

const filesWithImportMaps: ImportFileReference[] = [];

function sanitiseJSImportPath(importPath: string) {
  return importPath.replace(/\\/g, '/');
}

function findMatchingFileImport(filename: string): ImportFileReference | undefined {
  return filesWithImportMaps.find(x => x.name === filename);
}

function makeFileReference(filename: string, imports: string[]) {
  return { imports: imports, cssFiles: {}, name: filename };
}

function makeFileImportSpec(filename: string) {
  const parsed = path.parse(filename);
  return sanitiseJSImportPath(path.join(parsed.dir, parsed.name));
}

function makeImportAndNameMatcher(filename: string) {
  const importMatch = makeFileImportSpec(filename);

  return function (file: ImportFileReference) {
    return file.imports.indexOf(importMatch) !== -1 || file.name === filename;
  };
}

function getImportMatchesForCssFile(filename: string) {
  const importSpec = makeFileImportSpec(filename);
  debug('[STORE]', 'Import spec for matching', importSpec);
  const shouldUseCss = (file: ImportFileReference) => file.imports.includes(importSpec);
  return filesWithImportMaps.filter(shouldUseCss);
}

export function registerAllImportsForFile(filenameRef: string, importedFilenames: string[]): void {
  const filename = sanitiseJSImportPath(filenameRef);
  const imports = importedFilenames.map(makeFileImportSpec);
  const file = findMatchingFileImport(filename);
  if (file === undefined) {
    debug('[STORE]', 'Registered', imports, 'with', filename);
    filesWithImportMaps.push(makeFileReference(filename, imports));
    return;
  }

  debug('[STORE]', 'Updated', imports, 'with', filename);
  file.imports.push(...imports);
}

export function registerCssForInjection(filenameRef: string, css: string): void {
  const filename = sanitiseJSImportPath(filenameRef);
  debug('[STORE]', 'Registering css for', filename, 'against', css);

  // When we register css against a filename reference, the filename reference is the file that we are presently processing
  // so need to cross reference this filename reference with all the imports to find where this file is imported. That import
  // needs to have its css updated to include the styles.

  // Create a import spec of the file name to match import paths
  const shouldStoreCss = makeImportAndNameMatcher(filename);

  filesWithImportMaps.forEach((file) => {
    if (shouldStoreCss(file)) {
      // This file is imported by another module, or this is the master file - store the css against this match
      debug('[STORE]', 'Found cross reference for imported file', file.name, 'to store css against');
      file.cssFiles[filename] = {
        name: filename,
        css,
      };
    }
  });
}

export function getAllExternalCssDependencies(filenameRef: string): CssDependencies {
  const filename = sanitiseJSImportPath(filenameRef);
  debug('[STORE]', 'Looking up import of', filename);

  const cssInjection = getImportMatchesForCssFile(filename).reduce<CssDependencies>((deps: CssDependencies, file: ImportFileReference) => {
    deps.css += Object.entries(file.cssFiles).reduce((css: string, [_, v]) => {
      css += v.css;
      deps.dependencies.push(v.name);
      return css;
    }, '');
    return deps;
  }, {
    css: '',
    dependencies: [],
  });

  debug('[STORE]', 'Injecting css', cssInjection);
  return cssInjection;
}

// export function dump(): void {
//   console.dir(filesWithImportMaps, { depth: null });
// }
