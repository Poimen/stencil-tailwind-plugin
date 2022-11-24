import ts, { SourceFile, StringLiteral, SyntaxKind } from 'typescript';
import { debug } from '../debug/logger';
import { loadTypescriptCodeFromMemory, makeMatcher, walkTo } from '../helpers/tsFiles';
import { processSourceTextForTailwindInlineClasses, reduceDuplicatedClassesFromFunctionalComponentInjection } from '../helpers/tailwindcss';
import { getAllExternalCssDependencies } from '../store/store';
import { PluginConfigOpts } from '..';

async function transformStyleStatement(opts: PluginConfigOpts, sourceFile: SourceFile, sourceText: string, filename: string) {
  // Stencil produces stylesheet in esm, so need to read and emit back. Stencil outputs the css in the first
  // variable statement in the file. As such there is no clean way of detecting this, so just go grab the
  // first statement
  const stringLiteralPath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.FirstStatement),
    makeMatcher(SyntaxKind.VariableDeclarationList),
    makeMatcher(SyntaxKind.VariableDeclaration),
    makeMatcher(SyntaxKind.StringLiteral)
  ];

  // Grab any css that needs to be injected by functional components that this component imported
  const injectedCss = getAllExternalCssDependencies(filename).css;
  const stringStyleRewriter = async (cssNode: StringLiteral) => {
    const originalCss = cssNode.text;

    const tailwindClasses = await processSourceTextForTailwindInlineClasses(opts, filename, sourceText, originalCss);
    const reducedClasses = await reduceDuplicatedClassesFromFunctionalComponentInjection(opts, filename, tailwindClasses, injectedCss);

    cssNode.text = reducedClasses;
  };

  const cssNode = walkTo(sourceFile, stringLiteralPath);
  await stringStyleRewriter(cssNode as StringLiteral);

  const printer = ts.createPrinter();
  return printer.printFile(sourceFile);
}

// This function processes css that is contained as a string in a typescript file
// This transform is used when stencil passes a typescript encoded css blob rather than
// the raw file
export function transformCssFromTsxFileFormat(opts: PluginConfigOpts) {
  return async (sourceText: string, filename: string): Promise<string> => {
    debug('[Stylesheets]', 'Processing css from tsx source file:', filename);

    const sourceFile = loadTypescriptCodeFromMemory(sourceText);
    const transformed = await transformStyleStatement(opts, sourceFile, sourceText, filename);

    return transformed;
  };
}

// This function processes a pure css file - i.e. a file with the contents of a css file
// This transform is used during HMR where css files are passed around
export function transformCssFileFormat(opts: PluginConfigOpts) {
  return async (sourceCss: string, filename: string): Promise<string> => {
    debug('[Stylesheets]', 'Processing css source file:', filename);

    const injectedCss = getAllExternalCssDependencies(filename).css;
    const tailwindClasses = await processSourceTextForTailwindInlineClasses(opts, filename, sourceCss, sourceCss);
    const reducedClasses = await reduceDuplicatedClassesFromFunctionalComponentInjection(opts, filename, tailwindClasses, injectedCss);

    return reducedClasses;
  };
}
