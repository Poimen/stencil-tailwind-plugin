import path from 'path';
import fs from 'fs-extra';
import ts, { BinaryExpression, GetAccessorDeclaration, Identifier, ImportDeclaration, Modifier, ModifierSyntaxKind, Node, ReturnStatement, SourceFile, SyntaxKind, TransformationContext, Transformer, TransformerFactory } from 'typescript';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import * as log from '../debug/logger';
import { makeTailwindConfig } from '../config/tailwind';

interface ASTMatcher {
  nodeKind: SyntaxKind;
  name?: string;
  has?: ModifierSyntaxKind;
}

async function processSourceTextForTailwindInlineClasses(sourceText: string, fileName: string): Promise<string> {
  // TODO: this should be a config...
  const appcss = fs.readFileSync(path.resolve(path.join('src', 'config', 'app.css')));

  const twConf = makeTailwindConfig([fileName]);

  const postcssPlugins: AcceptedPlugin[] = [
    tailwindcss(twConf),
    cssnano() as AcceptedPlugin
  ];

  const result = await postcss(postcssPlugins).process(appcss, { from: fileName });

  return result.css;
}

function findNodeInTree(file: SourceFile, walkPath: ASTMatcher[], action: (node: Node) => Node): TransformerFactory<Node> {
  let treeLevel = 0;

  const hasReachedLastSelector = () => treeLevel === walkPath.length;

  function doesNodeMatch(node: Node) {
    const pathNode = walkPath[treeLevel];
    if (node.kind === pathNode.nodeKind) {
      if (pathNode.has) {
        if (!node.modifiers) return false;

        let found = false;
        for (let i = 0; i < node.modifiers.length; ++i) {
          if (node.modifiers[i].kind === pathNode.has) {
            found = true;
            break;
          }
        }

        if (!found) return false;
      }

      if (pathNode.name) {
        return node['name'] && node['name'].escapedText === pathNode.name;
      }

      return true;
    }
    return false;
  }

  return function(context: TransformationContext): Transformer<Node> {
    function visit(node: Node): Node | Array<Node> {
      log.debug('[Typescript]', 'Visiting ' + SyntaxKind[node.kind]);

      if (doesNodeMatch(node)) {
        treeLevel++;
        if (hasReachedLastSelector()) {
          return action(node);
        }
        log.debug('[Typescript]', 'Moving to next tree level', treeLevel, 'looking for', SyntaxKind[walkPath[treeLevel].nodeKind]);
        node = ts.visitEachChild(node, visit, context);
        return node;
      }

      return node;
    }

    return function(node: Node): Node {
      return ts.visitNode(node, visit);
    };
  };
}

function makeMatcher(kind: SyntaxKind, name?: string, modifier?: ModifierSyntaxKind): ASTMatcher {
  return { nodeKind: kind, name, has: modifier };
}

function transformSourceToIncludeNewTailwindStyles(sourceText: string, css: string): string {
  let rewroteStyles = false;
  const sourceFile = ts.createSourceFile('placeholder.ts', sourceText, ts.ScriptTarget.Latest);
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
  const binaryExpressionStylePath = [
    makeMatcher(SyntaxKind.SourceFile),
    makeMatcher(SyntaxKind.ExpressionStatement),
    makeMatcher(SyntaxKind.BinaryExpression)
  ];

  const returnStatementRewriter = (node: Node) => {
    rewroteStyles = true;
    const returnStatement = node as ReturnStatement;
    const originalExpression = returnStatement.expression as Identifier;
    return ts.factory.updateReturnStatement(returnStatement, ts.factory.createIdentifier(`'${css} ' +  ${originalExpression.escapedText}`));
  };

  const binaryExpressionRewriter = (node: Node) => {
    rewroteStyles = true;
    const binaryStatement = node as BinaryExpression;

    if (ts.isPropertyAccessExpression(binaryStatement.left) && binaryStatement.left.name && binaryStatement.left.name.escapedText === 'style') {
      const originalExpression = binaryStatement.right as Identifier;
      return ts.factory.updateBinaryExpression(binaryStatement, binaryStatement.left, ts.SyntaxKind.EqualsToken, ts.factory.createIdentifier(`'${css} ' +  ${originalExpression.escapedText}`));
    }
    log.error('[Typescript]', 'Found a binary statement, but failed to match it to style!');
    return node;
  };

  let result: ts.TransformationResult<ts.Node>;
  result = ts.transform(sourceFile, [findNodeInTree(sourceFile, getAccessorPath, returnStatementRewriter)]);
  if (!rewroteStyles) {
    result = ts.transform(sourceFile, [findNodeInTree(sourceFile, binaryExpressionStylePath, binaryExpressionRewriter)]);
  }

  if (!rewroteStyles) {
    log.error('[Typescript]', 'Expected to re-write styles for components, but no style definition was found!');
  }

  const [transformed] = result.transformed;
  const printer = ts.createPrinter();
  return printer.printFile(transformed as SourceFile);
}

export async function transform(sourceText: string, fileName: string): Promise<string> {
  log.debug('[Typescript]', 'Processing source file:', fileName);

  // TODO: remove all import statements so that stencil shadow prop doesn't make classes appear
  const tailwindClasses = await processSourceTextForTailwindInlineClasses(sourceText, fileName);

  if (tailwindClasses.length === 0) {
    // No classes from tailwind to add, just give source back
    return sourceText;
  }

  const emitResult = transformSourceToIncludeNewTailwindStyles(sourceText, tailwindClasses);
  return emitResult;
}
