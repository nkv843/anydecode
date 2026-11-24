// Minimal Node globals required by json-schema-to-typescript and @apidevtools/json-schema-ref-parser in the browser.
const g = globalThis as Record<string, unknown>;

if (typeof g.process !== 'object' || g.process === null) {
  g.process = {
    env: {},
    browser: true,
    platform: '',
    cwd: () => '/',
    nextTick: (fn: (...args: unknown[]) => void, ...args: unknown[]) => {
      queueMicrotask(() => fn(...args));
    },
  };
} else {
  const proc = g.process as Record<string, unknown>;
  if (typeof proc.cwd !== 'function') {
    proc.cwd = () => '/';
  }
  if (typeof proc.env !== 'object' || proc.env === null) {
    proc.env = {};
  }
}

if (typeof g.Buffer === 'undefined') {
  g.Buffer = {
    isBuffer: () => false,
    from: (input: unknown) =>
      typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input as ArrayBufferLike),
    alloc: (size: number) => new Uint8Array(size),
  };
}
