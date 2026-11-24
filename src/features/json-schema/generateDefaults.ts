import { compileSchema, type JsonSchema } from 'json-schema-library';

export type ParseSchemaResult =
  | { status: 'empty' }
  | { status: 'valid'; schema: Record<string, unknown> }
  | { status: 'error'; error: string };

export type GenerateDefaultsResult =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'success'; output: string; preview: string; lineCount: number }
  | { status: 'error'; error: string };

export const countLines = (text: string): number => {
  if (!text) return 0;
  let count = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) count++;
  }
  return count;
};

export const createPreview = (output: string): string =>
  output.slice(0, 300).replace(/\s+/g, ' ').trim();

export const parseJsonSchemaInput = (rawInput: string): ParseSchemaResult => {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { status: 'empty' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? `Invalid JSON: ${err.message}` : 'Invalid JSON',
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { status: 'error', error: 'JSON Schema must be a JSON object' };
  }

  return { status: 'valid', schema: parsed as Record<string, unknown> };
};

export const generateDefaultValuesFromSchema = (
  schema: Record<string, unknown>
): GenerateDefaultsResult => {
  try {
    const schemaNode = compileSchema(schema as JsonSchema);
    const defaultData: unknown = schemaNode.getData();
    const output =
      defaultData === undefined ? 'undefined' : (JSON.stringify(defaultData, null, 2) ?? 'undefined');

    return {
      status: 'success',
      output,
      preview: createPreview(output),
      lineCount: countLines(output),
    };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Failed to generate default values',
    };
  }
};

/**
 * Parses a JSON Schema string and generates its default value using `getData()`.
 */
export const generateDefaultValues = (rawInput: string): GenerateDefaultsResult => {
  const parsed = parseJsonSchemaInput(rawInput);
  if (parsed.status !== 'valid') {
    return parsed;
  }
  return generateDefaultValuesFromSchema(parsed.schema);
};
