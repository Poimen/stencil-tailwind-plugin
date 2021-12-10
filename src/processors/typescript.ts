import path from 'path';
import ts, { ImportDeclaration, BinaryExpression, Identifier, Node, ReturnStatement, SourceFile, StringLiteral, SyntaxKind, ObjectLiteralExpression, PropertyAssignment, VariableDeclaration } from 'typescript';
import { debug, warn, error } from '../debug/logger';
import { loadTypescriptCodeFromMemory, makeMatcher, transformNodeWith, walkAll } from '../helpers/tsFiles';
import { processSourceTextForTailwindInlineClasses } from '../helpers/tailwindcss';
import { registerCssForInjection, registerImportForFile } from '../store/store';

interface TransformationResult {
  text: string;
  transformed: boolean;
}

function reWriteStyleForGetAccessor(sourceFile: SourceFile, css: string) {
  // Stencil creates variable class declarations that use:
  // static get style() { return '...'; }
  // This re-writes the return statement to include tailwind's styles
  const getAccessorPath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.VariableStatement, { modifier: SyntaxKind.ExportKeyword }),
    makeMatcher(SyntaxKind.VariableDeclarationList),
    makeMatcher(SyntaxKind.VariableDeclaration),
    makeMatcher(SyntaxKind.ClassExpression),
    makeMatcher(SyntaxKind.GetAccessor, { name: 'style', modifier: SyntaxKind.StaticKeyword }),
    makeMatcher(SyntaxKind.Block),
    makeMatcher(SyntaxKind.ReturnStatement)
  ];

  const returnStatementRewriter = (node: Node) => {
    const returnStatement = node as ReturnStatement;
    const originalExpression = returnStatement.expression as Identifier;
    return ts.factory.updateReturnStatement(returnStatement, ts.factory.createIdentifier(`${originalExpression.escapedText} + '${css}'`));
  };

  return transformNodeWith(sourceFile, getAccessorPath, returnStatementRewriter);
}

function reWriteStylePropertyAssignment(sourceFile: SourceFile, css: string) {
  // Stencil creates binary property assignment that uses:
  // ComponentClass.style = '...'
  // This re-writes the assignment to include tailwind's styles
  const binaryExpressionStylePath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.ExpressionStatement),
    makeMatcher(SyntaxKind.BinaryExpression)
  ];

  const createNewIdentifier = (origValue: ts.__String) => ts.factory.createIdentifier(`${origValue} + '${css}'`);

  const binaryExpressionRewriter = (node: Node) => {
    const binaryStatement = node as BinaryExpression;

    if (ts.isPropertyAccessExpression(binaryStatement.left) && binaryStatement.left.name && binaryStatement.left.name.escapedText === 'style') {
      if (ts.isObjectLiteralExpression(binaryStatement.right)) {
        // Object literals have multiple style properties involved, so add tailwind styles to each one
        const originalExpression = binaryStatement.right as ObjectLiteralExpression;
        const updatedProperties = originalExpression.properties.map(p => {
          const propertyAssignment = p as PropertyAssignment;
          const propertyName = (p.name as Identifier).escapedText as string;
          const originalAssignmentValue = (propertyAssignment.initializer as Identifier).escapedText;
          return ts.factory.createPropertyAssignment(
            propertyName,
            createNewIdentifier(originalAssignmentValue)
          );
        });
        return ts.factory.updateBinaryExpression(
          binaryStatement,
          binaryStatement.left,
          ts.SyntaxKind.EqualsToken,
          ts.factory.createObjectLiteralExpression(updatedProperties)
        );
      } else if (ts.isIdentifier(binaryStatement.right)) {
        const originalExpression = binaryStatement.right as Identifier;
        return ts.factory.updateBinaryExpression(
          binaryStatement,
          binaryStatement.left,
          ts.SyntaxKind.EqualsToken,
          createNewIdentifier(originalExpression.escapedText)
        );
      } else {
        warn('[Typescript]', 'Found a binary expression but', binaryStatement.right.kind, 'is not currently handled');
      }
    }
    error('[Typescript]', 'Found a binary statement, but failed to match it to style!');
    return node;
  };

  return transformNodeWith(sourceFile, binaryExpressionStylePath, binaryExpressionRewriter);
}

function addStylePropertyGetter(sourceFile: SourceFile, css: string) {
  // When there is no style url used, then Stencil does not generate a style property to
  // use for Tailwind style, so add it in
  const getAccessorPath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.VariableStatement),
    makeMatcher(SyntaxKind.VariableDeclarationList),
    makeMatcher(SyntaxKind.VariableDeclaration, { initializer: SyntaxKind.ClassExpression })
  ];

  let className = '';

  const returnStatementRewriter = (node: Node) => {
    const classDeclaration = node as VariableDeclaration;

    if (classDeclaration.name && classDeclaration.initializer && classDeclaration.initializer.kind === SyntaxKind.ClassExpression) {
      className = (classDeclaration.name as Identifier).escapedText as string;
    }
    return node;
  };

  const result = transformNodeWith(sourceFile, getAccessorPath, returnStatementRewriter);
  if (result.found) {
    const cssAssignment = ts.factory.createIdentifier(`'${css}'`);
    result.fullText = `${result.fullText}${className}.style = ${cssAssignment.escapedText};\n`;
  }

  return result;
}

function registerAllImports(sourceFile: SourceFile, filename: string) {
  const file = path.parse(filename);

  function handleImportDeclaration(node: Node): boolean {
    const importDecl = node as ImportDeclaration;
    const importFilename = importDecl.moduleSpecifier as StringLiteral;
    const importedFile = path.resolve(file.dir, importFilename.text);

    registerImportForFile(filename, importedFile);

    return false;
  }

  walkAll(sourceFile, SyntaxKind.ImportDeclaration, handleImportDeclaration);
}

function transformSourceToIncludeNewTailwindStyles(sourceFile: SourceFile, css: string): TransformationResult {
  let result = reWriteStyleForGetAccessor(sourceFile, css);
  if (!result.found) {
    // If there is no get accessor, fallback to the binary property setter on the class
    result = reWriteStylePropertyAssignment(sourceFile, css);
    if (!result.found) {
      // If no class style, inject it
      result = addStylePropertyGetter(sourceFile, css);
    }
  }

  return {
    text: result.fullText,
    transformed: result.found
  };
}

function preserveTailwindCssEscaping(css: string) {
  // Tailwind JIT syntax needs to escape the '#', '[', ']', etc. in the css output. When writing
  // the escaped characters, the tailwind escaping is lost as the string output doesn't keep the
  // escaping as it doesn't know that they should be escaped in css.
  //
  // This replacement ensures the escaped characters from tailwind are kept escaped so the ending css
  // is correct when applied to styles in css.
  return css.replace(/\\/g, '\\\\');
}

export async function transform(sourceText: string, filename: string): Promise<string> {
  debug('[Typescript]', 'Processing source file:', filename);

  // TODO: remove all import statements so that stencil shadow prop doesn't make classes appear
  const tailwindClasses = await processSourceTextForTailwindInlineClasses(filename);

  if (tailwindClasses.length === 0) {
    // No classes from tailwind to add, just give source back
    return sourceText;
  }

  const escapedCss = preserveTailwindCssEscaping(tailwindClasses);

  const sourceFile = loadTypescriptCodeFromMemory(sourceText);
  registerAllImports(sourceFile, filename);

  const emitResult = transformSourceToIncludeNewTailwindStyles(sourceFile, escapedCss);

  if (!emitResult.transformed) {
    // No placeholder for the css found - register this css for a later style import
    registerCssForInjection(filename, tailwindClasses);
  }

  return emitResult.text;
}
