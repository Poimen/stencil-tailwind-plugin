import ts, { ModifierSyntaxKind, Node, ScriptTarget, SourceFile, SyntaxKind, TransformationContext, TransformerFactory, Transformer } from 'typescript';
import * as log from '../debug/logger';

export interface ASTMatcher {
  nodeKind: SyntaxKind;
  name?: string;
  has?: ModifierSyntaxKind;
}

export function loadTypescriptCodeFromMemory(code: string): SourceFile {
  return ts.createSourceFile('placeholder.ts', code, ScriptTarget.Latest);
}

function doesNodeMatch(walkPath: ASTMatcher[]) {
  return function(node: Node, treeLevel: number) {
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
  };
}

export function walkTo(file: SourceFile, walkPath: ASTMatcher[]): Node {
  const doesMatch = doesNodeMatch(walkPath);
  let treeLevel = 0;

  const hasReachedLastSelector = () => treeLevel === walkPath.length;

  function walkChildNodeTree(node: Node) {
    if (doesMatch(node, treeLevel)) {
      treeLevel++;
      if (hasReachedLastSelector()) {
        return node;
      }
    }
    return ts.forEachChild(node, walkChildNodeTree);
  }
  return walkChildNodeTree(file);
}

export function makeMatcher(kind: SyntaxKind, name?: string, modifier?: ModifierSyntaxKind): ASTMatcher {
  return { nodeKind: kind, name, has: modifier };
}

export type ASTMatchCallback = (node: Node) => Node;

function getNodeToTransform(walkPath: ASTMatcher[], action: ASTMatchCallback): TransformerFactory<Node> {
  let treeLevel = 0;
  const doesMatch = doesNodeMatch(walkPath);

  const hasReachedLastSelector = () => treeLevel === walkPath.length;

  return function(context: TransformationContext): Transformer<Node> {
    function visit(node: Node): Node | Array<Node> {
      log.debug('[Typescript]', 'Visiting ' + SyntaxKind[node.kind]);

      if (doesMatch(node, treeLevel)) {
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

export interface TransformedResult {
  found: boolean;
  fullText: string;
}

export function transformNodeWith(sourceFile: SourceFile, walkPath: ASTMatcher[], userAction: ASTMatchCallback): TransformedResult {
  let foundNodeInTree = false;

  function foundNodeInAST(node: Node) {
    log.debug('Found Node, calling user processing');
    foundNodeInTree = true;

    return userAction(node);
  }

  const result = ts.transform(sourceFile, [getNodeToTransform(walkPath, foundNodeInAST)]);
  const [transformed] = result.transformed;
  const printer = ts.createPrinter();
  return {
    found: foundNodeInTree,
    fullText: printer.printFile(transformed as SourceFile)
  };
}
