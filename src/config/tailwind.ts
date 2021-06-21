import { TailwindConfig } from 'tailwindcss/tailwind-config';

export function makeTailwindConfig(purgeFileList: string[]): TailwindConfig {
  const twConf = {
    mode: 'jit',
    purge: purgeFileList,
    darkMode: false,
    plugins: []
  };

  // HACK! Current tailwind types don't have the 'jit' mode field so make the type
  // look as if it is meant to be there
  return (twConf as unknown) as TailwindConfig;
}
