import * as prettier from 'prettier/standalone';
import prettierPluginEstree from 'prettier/plugins/estree';
import prettierPluginTypescript from 'prettier/plugins/typescript';
import type { Options, Plugin } from 'prettier';

const defaultPlugins = [prettierPluginTypescript, prettierPluginEstree] as Plugin[];

export const format = (code: string, options?: Options): Promise<string> =>
  prettier.format(code, {
    ...options,
    plugins: [...defaultPlugins, ...(options?.plugins ?? [])],
  });

export default {
  format,
};
