import { revealSeries } from './reveal';

describe('revealSeries', () => {
  const line: [number, number][] = [[0, 0], [10, 0], [10, 10]];
  it('returns nothing at 0 and everything at 1', () => {
    expect(revealSeries(line, 0)).toEqual([]);
    expect(revealSeries(line, 1)).toEqual(line);
  });
  it('interpolates the end point', () => {
    expect(revealSeries(line, 0.25)).toEqual([[0, 0], [5, 0]]);
    expect(revealSeries(line, 0.75)).toEqual([[0, 0], [10, 0], [10, 5]]);
  });
});
