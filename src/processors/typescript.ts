import ts, { BinaryExpression, Identifier, Node, ReturnStatement, SourceFile, SyntaxKind } from 'typescript';
import * as log from '../debug/logger';
import { loadTypescriptCodeFromMemory, makeMatcher, transformNodeWith } from '../helpers/tsFiles';
import { processSourceTextForTailwindInlineClasses } from '../helpers/tailwindcss';

function reWriteStyleForGetAccessor(sourceFile: SourceFile, css: string) {
  // Stencil creates variable class declarations that use:
  // static get style() { return '...'; }
  // This re-writes the return statement to include tailwind's styles
  const getAccessorPath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.VariableStatement, undefined, SyntaxKind.ExportKeyword),
    makeMatcher(SyntaxKind.VariableDeclarationList),
    makeMatcher(SyntaxKind.VariableDeclaration),
    makeMatcher(SyntaxKind.ClassExpression),
    makeMatcher(SyntaxKind.GetAccessor, 'style', SyntaxKind.StaticKeyword),
    makeMatcher(SyntaxKind.Block),
    makeMatcher(SyntaxKind.ReturnStatement)
  ];

  const returnStatementRewriter = (node: Node) => {
    const returnStatement = node as ReturnStatement;
    const originalExpression = returnStatement.expression as Identifier;
    return ts.factory.updateReturnStatement(returnStatement, ts.factory.createIdentifier(`'${css} ' +  ${originalExpression.escapedText}`));
  };

  return transformNodeWith(sourceFile, getAccessorPath, returnStatementRewriter);
}

function reWriteStyleClassAssignment(sourceFile: SourceFile, css: string) {
  // Stencil creates binary property assignment that use:
  // ComponentClass.style = '...'
  // This re-writes the assignment to include tailwind's styles
  const binaryExpressionStylePath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.ExpressionStatement),
    makeMatcher(SyntaxKind.BinaryExpression)
  ];

  const binaryExpressionRewriter = (node: Node) => {
    const binaryStatement = node as BinaryExpression;

    if (ts.isPropertyAccessExpression(binaryStatement.left) && binaryStatement.left.name && binaryStatement.left.name.escapedText === 'style') {
      const originalExpression = binaryStatement.right as Identifier;
      return ts.factory.updateBinaryExpression(binaryStatement, binaryStatement.left, ts.SyntaxKind.EqualsToken, ts.factory.createIdentifier(`'${css} ' +  ${originalExpression.escapedText}`));
    }
    log.error('[Typescript]', 'Found a binary statement, but failed to match it to style!');
    return node;
  };

  return transformNodeWith(sourceFile, binaryExpressionStylePath, binaryExpressionRewriter);
}

function transformSourceToIncludeNewTailwindStyles(sourceText: string, css: string): string {
  const sourceFile = loadTypescriptCodeFromMemory(sourceText);

  let result = reWriteStyleForGetAccessor(sourceFile, css);
  if (!result.found) {
    // If there is no get accessor, fallback to the binary property setter on the class
    result = reWriteStyleClassAssignment(sourceFile, css);
  }

  if (!result.found) log.error('[Typescript]', 'Expected to re-write styles for components, but no style definition was found!');

  return result.fullText;
}

export async function transform(sourceText: string, fileName: string): Promise<string> {
  log.debug('[Typescript]', 'Processing source file:', fileName);

  // TODO: remove all import statements so that stencil shadow prop doesn't make classes appear
  const tailwindClasses = await processSourceTextForTailwindInlineClasses(fileName);

  if (tailwindClasses.length === 0) {
    // No classes from tailwind to add, just give source back
    return sourceText;
  }

  const emitResult = transformSourceToIncludeNewTailwindStyles(sourceText, tailwindClasses);
  return emitResult;
}
