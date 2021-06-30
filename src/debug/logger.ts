import chalk from 'chalk';

let _debugEnabled = false;

export function json(obj: Record<string, unknown>): void {
  _debugEnabled && console.dir(obj, { depth: null });
}

export function debug(...statements: Array<any>): void {
  _debugEnabled && console.log(chalk.bold.blue('[DBG]'), ...statements);
}

export function success(...statements: Array<any>): void {
  console.log(chalk.bold.green('[SCS]'), ...statements);
}

export function warn(...statements: Array<any>): void {
  console.log(chalk.bold.yellowBright('[WRN]'), ...statements);
}

export function error(...statements: Array<any>): void {
  console.log(chalk.bold.bgRedBright('[ERR]'), chalk.bold.red(...statements));
}

export function configureLogging(enableDebug: boolean): void {
  _debugEnabled = enableDebug;
}
