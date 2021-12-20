import path from 'path';
import { debug } from '../debug/logger';

interface ImportFileReference {
  imports: string[];
  css: string
  name: string;
}

const filesWithImportMaps: ImportFileReference[] = [];

function findMatchingFileImport(filename: string): ImportFileReference | undefined {
  return filesWithImportMaps.find(x => x.name === filename);
}

function makeFileReference(fileRef: string, imports: string[]) {
  return { imports: imports, css: '', name: fileRef };
}

export function registerAllImportsForFile(filenameRef: string, importedFilenames: string[]): void {
  const file = findMatchingFileImport(filenameRef);
  if (file === undefined) {
    debug('[STORE]', 'Registered', importedFilenames, 'with', filenameRef);
    filesWithImportMaps.push(makeFileReference(filenameRef, importedFilenames));
    return;
  }

  debug('[STORE]', 'Updated', importedFilenames, 'with', filenameRef);
  file.imports.push(...importedFilenames);
}

function makeFileImportSpec(filenameRef: string) {
  const parsed = path.parse(filenameRef);
  return path.join(parsed.dir, parsed.name);
}

function makeImportAndNameMatcher(filenameRef: string) {
  const importMatch = makeFileImportSpec(filenameRef);

  return function(file: ImportFileReference) {
    return file.imports.indexOf(importMatch) !== -1 || file.name === filenameRef;
  };
}

export function registerCssForInjection(filenameRef: string, css: string): void {
  debug('[STORE]', 'Registering css for', filenameRef, 'against', css);

  // When we register css against a filename reference, the filename reference is the file that we are presently processing
  // so need to cross reference this filename reference with all the imports to find where this file is imported. That import
  // needs to have its css updated to include the styles.

  // Create a import spec of the file name to match import paths
  const shouldStoreCss = makeImportAndNameMatcher(filenameRef);

  filesWithImportMaps.forEach(file => {
    if (shouldStoreCss(file)) {
      // This file is imported by another module, or this is the master file - store the css against this match
      debug('[STORE]', 'Found cross reference for imported file', file.name, 'to store css against');
      file.css += css;
    }
  });
}

export function getAllExternalCssForInjection(filenameRef: string): string {
  debug('[STORE]', 'Looking up import of', filenameRef);

  let cssInjection = '';

  const shouldUseCss = (imports: string[]) => imports.includes(filenameRef);
  filesWithImportMaps.forEach(file => {
    if (shouldUseCss(file.imports)) {
      debug('[STORE]', 'Found file', filenameRef, 'is imported in', file.name, ' - grab css to inject');
      cssInjection += file.css;
    }
  });

  debug('[STORE]', 'Injecting css', cssInjection);
  return cssInjection;
}

// export function dump(): void {
//   console.dir(_importFileReferences, { depth: null });
// }
