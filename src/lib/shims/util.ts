export const isDeepStrictEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepStrictEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
    if (!isDeepStrictEqual(aObj[key], bObj[key])) return false;
  }
  return true;
};

export const format = (template: unknown, ...args: unknown[]): string => {
  if (typeof template !== 'string') {
    return [template, ...args].map(String).join(' ');
  }
  let argIndex = 0;
  const formatted = template.replace(/%[sdifjoO%]/g, (match) => {
    if (match === '%%') return '%';
    if (argIndex >= args.length) return match;
    const val = args[argIndex++];
    if (match === '%j' || match === '%o' || match === '%O') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  });
  const rest = args.slice(argIndex).map(String);
  return rest.length ? `${formatted} ${rest.join(' ')}` : formatted;
};

const inspectFn = (value: unknown): string => {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const inspect = Object.assign(inspectFn, {
  custom: Symbol.for('nodejs.util.inspect.custom'),
});

export default {
  isDeepStrictEqual,
  format,
  inspect,
};
