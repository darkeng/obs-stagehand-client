// Suggest width/height percentages so an element renders with the requested
// aspect ratio inside a 16:9 canvas (where the canvas is 16/9 ≈ 1.778 wide).
//
// For a target ratio `a` (width/height) inside canvas ratio `c`:
//   width_pc / height_pc = a / c
// When canvas is 16:9, a = 16/9 → equal % gives 16:9; a = 9/16 → narrow vertical.

const CANVAS_ASPECT = 16 / 9;

export function sizeForAspect(aspectStr) {
  switch (aspectStr) {
    case '9:16':
      return { width_pc: 22, height_pc: 70 };
    case '1:1':
      return { width_pc: 30, height_pc: 53 };
    case '4:3':
      return { width_pc: 36, height_pc: 48 };
    case '16:9':
    default:
      return { width_pc: 40, height_pc: 40 };
  }
}

export function aspectRatioOf(width_pc, height_pc) {
  if (!height_pc) return null;
  return (width_pc / height_pc) * CANVAS_ASPECT;
}
