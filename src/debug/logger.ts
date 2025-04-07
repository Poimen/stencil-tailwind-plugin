/* eslint-disable @typescript-eslint/no-unused-expressions */
import chalk from 'chalk';

let _debugEnabled = false;

export function json(obj: Record<string, unknown>): void {
  _debugEnabled && console.dir(obj, { depth: null });
}

export function debug(...statements: (string | object | number)[]): void {
  _debugEnabled && console.log(chalk.bold.blue('[DBG]'), ...statements);
}

export function success(...statements: (string | object | number)[]): void {
  console.log(chalk.bold.green('[SCS]'), ...statements);
}

export function warn(...statements: (string | object | number)[]): void {
  console.log(chalk.bold.yellowBright('[WRN]'), ...statements);
}

export function error(...statements: (string | object | number)[]): void {
  console.log(chalk.bold.bgRedBright('[ERR]'), chalk.bold.red(...statements));
}

export function configureLogging(enableDebug: boolean): void {
  _debugEnabled = enableDebug;
}

export function isDebugEnabled(): boolean {
  return _debugEnabled;
}
