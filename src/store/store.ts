import path from 'path';
import * as log from '../debug/logger';

interface ImportFileReference {
  imports: string[];
  css: string
}

interface ImportFileMap {
  [key: string]: ImportFileReference;
}

const _importFileReferences: ImportFileMap = {};

function makeFileReference(fileRef: string) {
  if (!_importFileReferences[fileRef]) {
    _importFileReferences[fileRef] = { imports: [], css: '' };
  }
  return _importFileReferences[fileRef];
}

export function registerImportForFile(filenameRef: string, importedFilename: string): void {
  log.debug('[STORE]', 'Registering import', importedFilename, 'against', filenameRef);
  const importRef = makeFileReference(filenameRef);
  importRef.imports.push(importedFilename);
}

export function registerCssForInjection(filenameRef: string, css: string): void {
  log.debug('[STORE]', 'Registering css for', filenameRef, 'against', css);

  // When we register css against a filename reference, the filename reference is the file that we are presently processing
  // so need to cross reference this filename reference with all the imports to find where this file is imported. That import
  // needs to have its css updated to include the styles.
  const file = path.parse(filenameRef);

  const importName = path.join(file.dir, file.name);
  Object.entries(_importFileReferences).forEach(([k, v]) => {
    if (v.imports.includes(importName)) {
      log.debug('[STORE]', 'Found cross reference for imported file', importName, 'to store css against');
      v.css += css;
    }
  });
}

export function getAllExternalCssForInjection(filenameRef: string): string {
  log.debug('[STORE]', 'Looking up import of', filenameRef);

  let cssInjection = '';

  Object.entries(_importFileReferences).forEach(([k, v]) => {
    if (v.imports.includes(filenameRef)) {
      log.debug('[STORE]', 'Found imported file to store grab css to inject', k);
      cssInjection += v.css;
    }
  });

  return cssInjection;
}

// export function dump(): void {
//   console.dir(_importFileReferences, { depth: null });
// }
