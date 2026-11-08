// Shared motion-sampling helpers for the browser specs.

export type Box = { x: number; y: number; width: number; height: number };

// A surface straddles the divider while its left edge is left of it and its right edge is right of it.
// Layout projection moves both edges linearly with one progress value, so the path between two sampled
// frames is a straight line in (left, right) space. Testing that line, as well as the frames themselves,
// keeps the assertion strict (the surface must really straddle) without depending on a sample landing in
// a window that can last under one frame on a slow machine.
export function straddlesDivider(frames: readonly Pick<Box, "x" | "width">[], divider: number) {
  const inside = (left: number, right: number) => left < divider && right > divider;
  return frames.some((frame, index) => {
    if (inside(frame.x, frame.x + frame.width)) return true;
    const previous = frames[index - 1];
    if (!previous) return false;
    const [x0, r0, x1, r1] = [previous.x, previous.x + previous.width, frame.x, frame.x + frame.width];
    let low = 0, high = 1;
    for (const [start, end, wantBelow] of [[x0, x1, true], [r0, r1, false]] as const) {
      const delta = end - start;
      if (delta === 0) { if ((start < divider) !== wantBelow) return false; continue; }
      const at = (divider - start) / delta; // progress where this edge meets the divider
      if ((delta > 0) === wantBelow) high = Math.min(high, at); else low = Math.max(low, at);
    }
    return low < high;
  });
}
