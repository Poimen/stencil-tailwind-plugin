import ts, { SourceFile, StringLiteral, SyntaxKind } from 'typescript';
import * as log from '../debug/logger';
import { loadTypescriptCodeFromMemory, makeMatcher, walkTo } from '../helpers/tsFiles';
import { processSourceTextForTailwindInlineClasses } from '../helpers/tailwindcss';
// import { getAllExternalCssForInjection } from '../store/store';

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

  // After solving the race condition on the build, stencil 2.6 seems to
  // be correctly doing this injection. Leaving this code here for now for
  // further testing
  // const injectedCss = getAllExternalCssForInjection(filename);

  const stringStyleRewriter = async (cssNode: StringLiteral) => {
    const originalCss = cssNode.text;

    const tailwindClasses = await processSourceTextForTailwindInlineClasses(filename, false, originalCss);

    // cssNode.text = injectedCss + tailwindClasses;
    cssNode.text = tailwindClasses;
  };

  const cssNode = walkTo(sourceFile, stringLiteralPath);
  await stringStyleRewriter(cssNode as StringLiteral);

  const printer = ts.createPrinter();
  return printer.printFile(sourceFile);
}

export async function transform(sourceText: string, filename: string): Promise<string> {
  log.debug('[Stylesheets]', 'Processing source file:', filename);

  const sourceFile = loadTypescriptCodeFromMemory(sourceText);
  const transformed = await transformStyleStatement(sourceFile, filename);

  return transformed;
}
