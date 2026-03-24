export const exportPng = (matrix: boolean[][], exportSize: number) => {
  if (!matrix) return;
  const padding = Math.round(exportSize * 0.1); // 10% padding
  const qrSize = exportSize;
  const totalSize = qrSize + padding * 2;
  const moduleSize = qrSize / matrix.length;
  const cornerRadius = 24; // matches rounded-xl
  const rx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--qr-rx') || '0');
  const fg = getComputedStyle(document.documentElement).getPropertyValue('--qr-fg').trim() || '#000000';
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--qr-bg').trim() || '#ffffff';

  const canvas = document.createElement('canvas');
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext('2d')!;

  // Draw rounded background
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, totalSize, totalSize, cornerRadius);
  ctx.fill();

  // Draw QR modules with offset for padding
  ctx.fillStyle = fg;
  const moduleRadius = rx * moduleSize;
  matrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        const px = padding + x * moduleSize;
        const py = padding + y * moduleSize;
        if (moduleRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(px, py, moduleSize, moduleSize, moduleRadius);
          ctx.fill();
        } else {
          ctx.fillRect(px, py, moduleSize, moduleSize);
        }
      }
    });
  });

  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};
