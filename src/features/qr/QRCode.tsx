import { memo } from "react";

export const QrCodeSvg = memo(({ matrix }: { matrix: boolean[][] }) => (
  <svg viewBox={`0 0 ${matrix.length} ${matrix.length}`}>
    <rect width="100%" height="100%" fill="var(--qr-bg)" />
    <g fill="var(--qr-fg)">
      {matrix.flatMap((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              rx="var(--qr-rx)"
            />
          ) : null
        )
      )}
    </g>
  </svg>
));