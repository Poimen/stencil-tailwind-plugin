import ts, { SourceFile, StringLiteral, SyntaxKind } from 'typescript';
import { debug } from '../debug/logger';
import { loadTypescriptCodeFromMemory, makeMatcher, walkTo } from '../helpers/tsFiles';
import { processSourceTextForTailwindInlineClasses, reduceDuplicatedClassesFromFunctionalComponentInjection } from '../helpers/tailwindcss';
import { getAllExternalCssForInjection } from '../store/store';

async function transformStyleStatement(sourceFile: SourceFile, filename: string) {
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
  const injectedCss = getAllExternalCssForInjection(filename);
  const stringStyleRewriter = async (cssNode: StringLiteral) => {
    const originalCss = cssNode.text;

    const tailwindClasses = await processSourceTextForTailwindInlineClasses(filename, false, originalCss);
    const reducedClasses = await reduceDuplicatedClassesFromFunctionalComponentInjection(filename, tailwindClasses, injectedCss);

    cssNode.text = reducedClasses;
  };

  const cssNode = walkTo(sourceFile, stringLiteralPath);
  await stringStyleRewriter(cssNode as StringLiteral);

  const printer = ts.createPrinter();
  return printer.printFile(sourceFile);
}

export async function transform(sourceText: string, filename: string): Promise<string> {
  debug('[Stylesheets]', 'Processing source file:', filename);

  const sourceFile = loadTypescriptCodeFromMemory(sourceText);
  const transformed = await transformStyleStatement(sourceFile, filename);

  return transformed;
}
