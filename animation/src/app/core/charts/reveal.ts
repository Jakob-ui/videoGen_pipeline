// Pure TypeScript – lets a line "draw itself" frame-exactly.

export type Point = [number, number];

/**
 * Returns the points up to `progress` (0..1) of the total polyline length,
 * plus one interpolated end point. Length is measured in data coordinates.
 */
export function revealSeries(points: Point[], progress: number): Point[] {
  if (points.length === 0 || progress <= 0) return [];
  if (progress >= 1 || points.length === 1) return points.slice();

  const segments = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = segments.reduce((a, b) => a + b, 0);
  let remaining = total * progress;

  const result: Point[] = [points[0]];
  for (let i = 0; i < segments.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (remaining >= segments[i]) {
      result.push(points[i + 1]);
      remaining -= segments[i];
    } else {
      const f = segments[i] === 0 ? 0 : remaining / segments[i];
      result.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
      break;
    }
  }
  return result;
}
