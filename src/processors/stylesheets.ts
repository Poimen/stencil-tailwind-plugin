import path from 'path';
import fs from 'fs-extra';
import ts, { BinaryExpression, GetAccessorDeclaration, Identifier, ImportDeclaration, Modifier, ModifierSyntaxKind, Node, ReturnStatement, SourceFile, SyntaxKind, TransformationContext, Transformer, TransformerFactory } from 'typescript';
import cssnano from 'cssnano';
import tailwindcss from 'tailwindcss';
import postcss, { AcceptedPlugin } from 'postcss';
import * as log from '../debug/logger';
import { makeTailwindConfig } from '../config/tailwind';

export async function transform(sourceText: string, fileName: string): Promise<string> {
  log.debug('[Stylesheets]', 'Processing source file:', fileName);

  // TODO: remove all import statements so that stencil shadow prop doesn't make classes appear
  const tailwindClasses = await processSourceTextForTailwindInlineClasses(sourceText, fileName);

  if (tailwindClasses.length === 0) {
    // No classes from tailwind to add, just give source back
    return sourceText;
  }

  const emitResult = transformSourceToIncludeNewTailwindStyles(sourceText, tailwindClasses);
  return emitResult;
}
