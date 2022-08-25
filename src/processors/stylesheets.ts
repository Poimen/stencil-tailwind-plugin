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

export function transform(opts: PluginConfigOpts) {
  return async (sourceText: string, filename: string): Promise<string> => {
    debug('[Stylesheets]', 'Processing source file:', filename);

    const sourceFile = loadTypescriptCodeFromMemory(sourceText);
    const transformed = await transformStyleStatement(opts, sourceFile, sourceText, filename);

    return transformed;
  };
}
