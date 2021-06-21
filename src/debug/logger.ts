import chalk from 'chalk';

export function json(obj: any): void {
  console.dir(obj, { depth: null });
}

export function debug(...statements: Array<any>): void {
  console.log(chalk.bold.blue(...statements));
}

export function success(...statements: Array<any>): void {
  console.log(chalk.bold.green(...statements));
}

export function warn(...statements: Array<any>): void {
  console.log(chalk.bold.yellowBright(...statements));
}

export function error(...statements: Array<any>): void {
  console.log(chalk.bold.red(...statements));
}
