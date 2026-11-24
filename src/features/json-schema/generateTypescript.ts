import type { JSONSchema4 } from 'json-schema';
import { countLines, createPreview } from './generateDefaults';

export type TypeScriptFlags = {
  additionalProperties: boolean;
  declareExternallyReferenced: boolean;
  enableConstEnums: boolean;
  format: boolean;
  ignoreMinAndMaxItems: boolean;
  inferStringEnumKeysFromValues: boolean;
  strictIndexSignatures: boolean;
  unknownAny: boolean;
  unreachableDefinitions: boolean;
};

export type TypeScriptFlagKey = keyof TypeScriptFlags;

export const DEFAULT_TYPESCRIPT_FLAGS: TypeScriptFlags = {
  additionalProperties: false,
  declareExternallyReferenced: true,
  enableConstEnums: true,
  format: true,
  ignoreMinAndMaxItems: false,
  inferStringEnumKeysFromValues: false,
  strictIndexSignatures: false,
  unknownAny: true,
  unreachableDefinitions: false,
};

export const TYPESCRIPT_FLAG_ITEMS: ReadonlyArray<{
  key: TypeScriptFlagKey;
  label: string;
  description: string;
}> = [
  {
    key: 'additionalProperties',
    label: 'Allow extra properties',
    description:
      'Include an index signature for unspecified properties when additionalProperties is not explicitly set.',
  },
  {
    key: 'declareExternallyReferenced',
    label: 'Declare external refs',
    description: 'Emit type declarations for external schemas referenced via $ref.',
  },
  {
    key: 'enableConstEnums',
    label: 'Const enums',
    description: 'Generate TypeScript const enum declarations instead of regular enums.',
  },
  {
    key: 'format',
    label: 'Format with Prettier',
    description:
      'Format generated TypeScript with Prettier. Turn off for faster generation on large schemas.',
  },
  {
    key: 'ignoreMinAndMaxItems',
    label: 'Ignore array bounds',
    description:
      'Ignore minItems and maxItems so arrays emit regular array types instead of fixed tuples.',
  },
  {
    key: 'inferStringEnumKeysFromValues',
    label: 'String enum keys',
    description: 'Generate named enums from string enum values instead of string union types.',
  },
  {
    key: 'strictIndexSignatures',
    label: 'Strict index signatures',
    description: 'Append | undefined to index signatures for compatibility with strictNullChecks.',
  },
  {
    key: 'unknownAny',
    label: 'Use unknown over any',
    description: 'Emit unknown instead of any for untyped schema values.',
  },
  {
    key: 'unreachableDefinitions',
    label: 'Include unused definitions',
    description: 'Generate types for definitions even when they are not referenced by the schema.',
  },
];

export type GenerateTypeScriptResult =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'success'; output: string; preview: string; lineCount: number }
  | { status: 'error'; error: string };

let compilePromise: Promise<typeof import('json-schema-to-typescript').compile> | null = null;

const loadCompile = (): Promise<typeof import('json-schema-to-typescript').compile> => {
  if (!compilePromise) {
    compilePromise = import('json-schema-to-typescript').then((mod) => mod.compile);
  }
  return compilePromise;
};

export const generateTypeScriptFromSchema = async (
  schema: Record<string, unknown>,
  flags: TypeScriptFlags
): Promise<GenerateTypeScriptResult> => {
  try {
    const compile = await loadCompile();
    const schemaName =
      typeof schema.title === 'string' && schema.title.trim() ? schema.title.trim() : 'Root';

    const output = await compile(schema as JSONSchema4, schemaName, {
      ...flags,
      cwd: '/',
    });

    const trimmedOutput = output.trimEnd();
    return {
      status: 'success',
      output: trimmedOutput,
      preview: createPreview(trimmedOutput),
      lineCount: countLines(trimmedOutput),
    };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Failed to generate TypeScript definitions',
    };
  }
};
