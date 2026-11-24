export const sep = '/';

export const normalize = (inputPath: string): string => {
  const isAbs = inputPath.startsWith('/');
  const parts = inputPath.replace(/\\/g, '/').split('/');
  const stack: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length && stack[stack.length - 1] !== '..') {
        stack.pop();
      } else if (!isAbs) {
        stack.push('..');
      }
    } else {
      stack.push(part);
    }
  }

  const joined = stack.join('/');
  return (isAbs ? '/' : '') + joined || (isAbs ? '/' : '.');
};

export const join = (...paths: string[]): string =>
  normalize(paths.filter(Boolean).join('/'));

export const dirname = (inputPath: string): string => {
  const normalized = inputPath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  if (idx === -1) return '.';
  if (idx === 0) return '/';
  return normalized.slice(0, idx);
};

export const basename = (inputPath: string, ext?: string): string => {
  const normalized = inputPath.replace(/\\/g, '/').replace(/\/+$/, '');
  const idx = normalized.lastIndexOf('/');
  const base = idx === -1 ? normalized : normalized.slice(idx + 1);
  if (ext && base.endsWith(ext)) {
    return base.slice(0, base.length - ext.length);
  }
  return base;
};

export const extname = (inputPath: string): string => {
  const base = basename(inputPath);
  const idx = base.lastIndexOf('.');
  return idx <= 0 ? '' : base.slice(idx);
};

export const posix = {
  sep,
  normalize,
  join,
  dirname,
  basename,
  extname,
};

export default {
  sep,
  normalize,
  join,
  dirname,
  basename,
  extname,
  posix,
};
