export const readFileSync = (): never => {
  throw new Error('fs.readFileSync is not available in the browser');
};

export default {
  readFileSync,
};
