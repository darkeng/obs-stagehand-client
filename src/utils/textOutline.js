// Build a text outline using stacked text-shadow offsets. Avoids the spike
// artifacts of `-webkit-text-stroke` at acute glyph joins (no miter geometry).
export function textOutline(width, color) {
  const w = Math.max(0, Math.min(8, Math.round(Number(width) || 0)));
  if (w === 0) return 'none';
  const c = color || '#000000';
  const offsets = [];
  for (let r = 1; r <= w; r++) {
    const d = +(r * 0.707).toFixed(2);
    offsets.push(
      `${-r}px 0 0 ${c}`,
      `${r}px 0 0 ${c}`,
      `0 ${-r}px 0 ${c}`,
      `0 ${r}px 0 ${c}`,
      `${-d}px ${-d}px 0 ${c}`,
      `${d}px ${d}px 0 ${c}`,
      `${-d}px ${d}px 0 ${c}`,
      `${d}px ${-d}px 0 ${c}`,
    );
  }
  return offsets.join(', ');
}
