import ts, { SourceFile, StringLiteral, SyntaxKind } from 'typescript';
import * as log from '../debug/logger';
import { loadTypescriptCodeFromMemory, makeMatcher, walkTo } from '../helpers/tsFiles';
import { processSourceTextForTailwindInlineClasses } from '../helpers/tailwindcss';

async function transformStyleStatement(sourceFile: SourceFile, fileName: string) {
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

  const stringStyleRewriter = async (cssNode: StringLiteral) => {
    const originalCss = cssNode.text;

    const tailwindClasses = await processSourceTextForTailwindInlineClasses(fileName, originalCss);

    cssNode.text = tailwindClasses;
  };

  const cssNode = walkTo(sourceFile, stringLiteralPath);
  await stringStyleRewriter(cssNode as StringLiteral);

  const printer = ts.createPrinter();
  return printer.printFile(sourceFile);
}

export async function transform(sourceText: string, fileName: string): Promise<string> {
  log.debug('[Stylesheets]', 'Processing source file:', fileName);

  const sourceFile = loadTypescriptCodeFromMemory(sourceText);
  const transformed = await transformStyleStatement(sourceFile, fileName);

  return transformed;
}
