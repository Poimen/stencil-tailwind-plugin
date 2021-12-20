import path from 'path';
import ts, { ImportDeclaration, Identifier, Node, SourceFile, StringLiteral, SyntaxKind, VariableDeclaration } from 'typescript';
import { debug } from '../debug/logger';
import { loadTypescriptCodeFromMemory, makeMatcher, transformNodeWith, walkAll, walkTo } from '../helpers/tsFiles';
import { processSourceTextForTailwindInlineClasses } from '../helpers/tailwindcss';
import { registerAllImportsForFile, registerCssForInjection } from '../store/store';

interface TransformationResult {
  text?: string;
  transformed: boolean;
}

function hasStyleGetAccessor(sourceFile: SourceFile) {
  // Stencil creates variable class declarations that use:
  // static get style() { return '...'; }
  // This checks if the class has a get accessor
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

  return walkTo(sourceFile, getAccessorPath) !== undefined;
}

function hasStyleProperty(sourceFile: SourceFile) {
  // Stencil creates binary property assignment that uses:
  // ComponentClass.style = '...'
  const binaryExpressionStylePath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.ExpressionStatement),
    makeMatcher(SyntaxKind.BinaryExpression)
  ];

  return walkTo(sourceFile, binaryExpressionStylePath) !== undefined;
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
  const importedFiles = [];

  function handleImportDeclaration(node: Node): boolean {
    const importDecl = node as ImportDeclaration;
    const importFilename = importDecl.moduleSpecifier as StringLiteral;
    const importedFile = path.resolve(file.dir, importFilename.text);

    importedFiles.push(importedFile);

    return false;
  }

  walkAll(sourceFile, SyntaxKind.ImportDeclaration, handleImportDeclaration);
  registerAllImportsForFile(filename, importedFiles);
}

function attemptTransformSourceToIncludeNewTailwindStyles(sourceFile: SourceFile, css: string): TransformationResult {
  // If stencil has created the style accessors, then there is a css file coming, don't transform now, push tailwind styles into
  // css file rather
  if (hasStyleGetAccessor(sourceFile) || hasStyleProperty(sourceFile)) {
    return { transformed: false };
  }

  // No styles, attempt to add one
  const result = addStylePropertyGetter(sourceFile, css);

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
  const tailwindClasses = await processSourceTextForTailwindInlineClasses(filename, sourceText);

  if (tailwindClasses.length === 0) {
    // No classes from tailwind to add, just give source back
    return sourceText;
  }

  const escapedCss = preserveTailwindCssEscaping(tailwindClasses);

  const sourceFile = loadTypescriptCodeFromMemory(sourceText);
  registerAllImports(sourceFile, filename);

  const emitResult = attemptTransformSourceToIncludeNewTailwindStyles(sourceFile, escapedCss);
  if (!emitResult.transformed) {
    // No placeholder for the css found - register this css for a later style import
    registerCssForInjection(filename, tailwindClasses);
    return sourceText;
  }

  return emitResult.text;
}
