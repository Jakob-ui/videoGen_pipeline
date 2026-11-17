import { FORMATTERS } from './formatters';

const f = (name: string, value: unknown) => ({
  display: FORMATTERS[name](value, 'display'),
  spoken: FORMATTERS[name](value, 'spoken'),
});

describe('formatters (AGENT.md §6.3)', () => {
  it('pct', () => {
    expect(f('pct', 106)).toEqual({ display: '106 %', spoken: '106 Prozent' });
    expect(f('pct', 99.24)).toEqual({ display: '99,24 %', spoken: '99 Komma 24 Prozent' });
  });
  it('pctAbs', () => {
    expect(f('pctAbs', -30)).toEqual({ display: '30 %', spoken: '30 Prozent' });
  });
  it('pctSigned', () => {
    expect(f('pctSigned', 2.4369)).toEqual({ display: '+2,44 %', spoken: '2 Komma 44 Prozent' });
    expect(f('pctSigned', -30)).toEqual({ display: '−30 %', spoken: '30 Prozent' });
  });
  it('eur', () => {
    expect(f('eur', 1290)).toEqual({ display: '1.290 €', spoken: '1290 Euro' });
  });
  it('pts', () => {
    expect(f('pts', 2598.25)).toEqual({ display: '2.598,25', spoken: '2598' });
  });
  it('int', () => {
    expect(f('int', 6)).toEqual({ display: '6', spoken: '6' });
  });
  it('date', () => {
    expect(f('date', '2032-06-23')).toEqual({ display: '23.06.2032', spoken: '23. Juni 2032' });
    expect(f('date', '2033-01-05').spoken).toBe('5. Jänner 2033');
    expect(f('date', '2026-11-11T08:54:34Z').display).toBe('11.11.2026');
  });
  it('yearsApprox', () => {
    expect(f('yearsApprox', 5.6247)).toEqual({ display: 'ca. 5,6 Jahre', spoken: 'rund fünfeinhalb Jahre' });
    expect(f('yearsApprox', 1.1).spoken).toBe('rund ein Jahr');
    expect(f('yearsApprox', 1.4).spoken).toBe('rund eineinhalb Jahre');
  });
  it('rounds half up', () => {
    expect(f('pct', 1.005).display).toBe('1,01 %');
    expect(f('pct', 1.1785).display).toBe('1,18 %');
  });
  it('throws on non-numbers', () => {
    expect(() => f('pct', 'abc')).toThrow();
  });
});
