function clamp(v, min = 0, max = 100) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Build a CSS clip-path. Two shapes:
//   - 'inset': rectangle clipped from each edge, with optional rounded corners.
//   - 'ellipse': ellipse fitting the cropped area; on a square box this produces
//     a circle, on a rectangular box a true ellipse (no "stadium" artifact).
export function buildClipPath(el) {
  if (!el?.mask_enabled) return 'none';
  const t = clamp(el.mask_top_pc, 0, 99);
  const r = clamp(el.mask_right_pc, 0, 99);
  const b = clamp(el.mask_bottom_pc, 0, 99);
  const l = clamp(el.mask_left_pc, 0, 99);

  if (t + b >= 100 || l + r >= 100) {
    return 'inset(50% 50% 50% 50%)';
  }

  if (el.mask_shape === 'ellipse') {
    const cx = (l + (100 - r)) / 2;
    const cy = (t + (100 - b)) / 2;
    const rx = (100 - l - r) / 2;
    const ry = (100 - t - b) / 2;
    return `ellipse(${rx}% ${ry}% at ${cx}% ${cy}%)`;
  }

  const round = clamp(el.mask_round_pc, 0, 50);
  return `inset(${t}% ${r}% ${b}% ${l}%${round ? ` round ${round}%` : ''})`;
}
