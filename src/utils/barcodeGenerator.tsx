/**
 * Generates an SVG barcode representation for any barcode/SKU string
 */

// Generate deterministic bar widths from input string
export function generateBarcodeBars(text: string): { width: number; isBar: boolean }[] {
  const bars: { width: number; isBar: boolean }[] = [];
  // Quiet zone
  bars.push({ width: 8, isBar: false });
  // Start pattern: 2 1 1 2 3 2
  bars.push({ width: 2, isBar: true }, { width: 1, isBar: false }, { width: 1, isBar: true }, { width: 2, isBar: false }, { width: 3, isBar: true }, { width: 2, isBar: false });

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const p1 = (code % 3) + 1;
    const p2 = ((code * 3) % 3) + 1;
    const p3 = ((code * 7) % 3) + 1;
    const p4 = ((code * 11) % 3) + 1;

    bars.push({ width: p1, isBar: true });
    bars.push({ width: p2, isBar: false });
    bars.push({ width: p3, isBar: true });
    bars.push({ width: p4, isBar: false });
  }

  // Stop pattern: 2 3 3 1 1 1 2
  bars.push({ width: 2, isBar: true }, { width: 3, isBar: false }, { width: 3, isBar: true }, { width: 1, isBar: false }, { width: 2, isBar: true });
  // Quiet zone
  bars.push({ width: 8, isBar: false });

  return bars;
}

export function BarcodeSvg({
  value,
  height = 54,
  className = '',
  showText = true,
}: {
  value: string;
  height?: number;
  className?: string;
  showText?: boolean;
}) {
  const bars = generateBarcodeBars(value);
  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto select-none"
        preserveAspectRatio="none"
        style={{ minHeight: `${height}px` }}
      >
        <rect width={totalWidth} height={height} fill="#ffffff" />
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBar) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={height}
              fill="#0f172a"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-medium tracking-widest text-slate-700 mt-1 tabular-nums">
          {value}
        </span>
      )}
    </div>
  );
}
