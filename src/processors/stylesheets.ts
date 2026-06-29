import ts, { SourceFile, StringLiteralLike, SyntaxKind } from 'typescript';
import { debug } from '../debug/logger';
import { loadTypescriptCodeFromMemory, makeMatcher, walkMultiplePathsTo, walkTo } from '../helpers/tsFiles';
import { processSourceTextForTailwindInlineClasses, reduceDuplicatedClassesFromFunctionalComponentInjection } from '../helpers/tailwindcss';
import { getAllExternalCssDependencies } from '../store/store';
import { PluginConfigurationOptions } from '..';

async function transformStyleStatement(opts: PluginConfigurationOptions, sourceFile: SourceFile, sourceText: string, filename: string) {
  // Stencil produces stylesheet in esm, so need to read and emit back. Stencil outputs the css in the first
  // variable statement in the file. As such there is no clean way of detecting this, so just go grab the
  // first statement
  const variableDeclarationPath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.FirstStatement),
    makeMatcher(SyntaxKind.VariableDeclarationList),
    makeMatcher(SyntaxKind.VariableDeclaration),
  ];
  const variableDeclaration = walkTo(sourceFile, variableDeclarationPath);
  if (variableDeclaration === undefined) {
    throw new Error(`[Stylesheets] Unable to find variable declaration for style property in file ${filename}`);
  }

  // In the case of Stencil Core < 4.39.0, the output of the source text is a string literal.
  const stringLiteralPath = [
    makeMatcher(SyntaxKind.VariableDeclaration),
    makeMatcher(SyntaxKind.StringLiteral),
  ];

  // In the case of Stencil Core >= 4.39.0, the output of the source text is an arrow function rather than
  // a string literal. The arrow function resolves to a template literal that contains the css.
  const arrowFunctionPath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.FirstStatement),
    makeMatcher(SyntaxKind.VariableDeclarationList),
    makeMatcher(SyntaxKind.VariableDeclaration),
    makeMatcher(SyntaxKind.ArrowFunction),
    makeMatcher(SyntaxKind.NoSubstitutionTemplateLiteral),
  ];

  // Grab any css that needs to be injected by functional components that this component imported
  const injectedCss = getAllExternalCssDependencies(filename).css;
  const stringStyleRewriter = async (cssNode: StringLiteralLike) => {
    const originalCss = cssNode.text;

    const tailwindClasses = await processSourceTextForTailwindInlineClasses(opts, filename, originalCss);
    const reducedClasses = await reduceDuplicatedClassesFromFunctionalComponentInjection(opts, filename, tailwindClasses, injectedCss);

    cssNode.text = reducedClasses;
  };

  const cssNode = walkMultiplePathsTo(sourceFile, [stringLiteralPath, arrowFunctionPath]);
  if (cssNode === undefined) {
    throw new Error(`[Stylesheets] Unable to find string literal or arrow function for style property in file ${filename}`);
  }

  await stringStyleRewriter(cssNode as StringLiteralLike);

  const printer = ts.createPrinter();
  return printer.printFile(sourceFile);
}

// This function processes css that is contained as a string in a typescript file
// This transform is used when stencil passes a typescript encoded css blob rather than
// the raw file
export function transformCssFromTsxFileFormat(opts: PluginConfigurationOptions) {
  return async (sourceText: string, filename: string): Promise<string> => {
    debug('[Stylesheets]', 'Processing css from tsx source file:', filename);

    const sourceFile = loadTypescriptCodeFromMemory(sourceText);
    const transformed = await transformStyleStatement(opts, sourceFile, sourceText, filename);

    return transformed;
  };
}

// This function processes a pure css file - i.e. a file with the contents of a css file
// This transform is used during HMR where css files are passed around
export function transformCssFileFormat(opts: PluginConfigurationOptions) {
  return async (sourceCss: string, filename: string): Promise<string> => {
    debug('[Stylesheets]', 'Processing css source file:', filename);

    const injectedCss = getAllExternalCssDependencies(filename).css;
    const tailwindClasses = await processSourceTextForTailwindInlineClasses(opts, filename, sourceCss);
    const reducedClasses = await reduceDuplicatedClassesFromFunctionalComponentInjection(opts, filename, tailwindClasses, injectedCss);

    return reducedClasses;
  };
}
