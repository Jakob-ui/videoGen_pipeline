import { loadContent, loadMockProduct, mockProductWith } from '../../testing/fixtures';
import { derive, payoffAt, zoneAt } from './derive';

const content = loadContent();
const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.0001);

describe('derive() with mock data (AGENT.md §5.2)', () => {
  const d = derive(loadMockProduct(), content.illustrations);

  it('computes the expected values', () => {
    close(d.distancePct, 2.4369);
    expect(d.position).toBe('ueber');
    expect(d.zone).toBe('schutz');
    expect(d.maxIndexPct).toBe(29);
    expect(d.protectionIndexPct).toBe(6);
    expect(d.indicativeRedemptionPct).toBe(106);
    expect(d.daysToMaturity).toBe(2053);
    close(d.yearsToMaturity, 5.6247);
    expect(d.termYears).toBe(6);
    expect(d.example).toEqual({ investment: 100, payoutAmount: 129, protectionAmount: 106 });
  });

  it('derives the illustration payouts (1:1 participation)', () => {
    expect(d.illustrations.a.payoutPct).toBe(110);
    expect(d.illustrations.b.payoutPct).toBe(106);
  });

  it('computes the stable y-band of the status chart in %', () => {
    expect(d.statusYBand).toEqual({ min: -10, max: 10, halfPct: 10 });
  });
});

describe('payoffAt() – protection floor, 1:1 participation, cap', () => {
  const product = loadMockProduct().product;

  it('pays the protection below +6 %', () => {
    expect(payoffAt(product, -30)).toBe(106);
    expect(payoffAt(product, 0)).toBe(106);
    expect(payoffAt(product, 6)).toBe(106);
  });

  it('participates 1:1 between +6 % and +29 %', () => {
    expect(payoffAt(product, 15)).toBe(115);
    expect(zoneAt(product, 15)).toBe('teilnahme');
  });

  it('is capped at 129 %', () => {
    expect(payoffAt(product, 29)).toBe(129);
    expect(payoffAt(product, 60)).toBe(129);
    expect(zoneAt(product, 29)).toBe('max');
  });

  it('still supports a digital payout (no participation)', () => {
    const digital = mockProductWith((p) => {
      p.product.participationPct = null;
      p.product.capPct = null;
      p.product.payoutLevelPctOfStart = 100;
    }).product;
    expect(payoffAt(digital, 0)).toBe(129);
    expect(payoffAt(digital, -0.1)).toBe(106);
  });
});

describe('derive() variants', () => {
  it('last = 2300 → unter', () => {
    const p = mockProductWith((p) => (p.quote.underlying.last = 2300));
    expect(derive(p, content.illustrations).position).toBe('unter');
  });

  it('last = startLevel → auf', () => {
    const p = mockProductWith((p) => (p.quote.underlying.last = p.underlying.startLevel));
    expect(derive(p, content.illustrations).position).toBe('auf');
  });

  it('computes the indicative redemption when the JSON has none', () => {
    const p = mockProductWith((p) => {
      p.quote.indicativeRedemptionPct = null;
      p.quote.underlying.last = p.underlying.startLevel * 1.12;
    });
    close(derive(p, content.illustrations).indicativeRedemptionPct, 112);
  });

  it('y-band grows in 5 % steps when the index leaves ±5 %', () => {
    const p = mockProductWith((p) => (p.quote.underlying.last = p.underlying.startLevel * 0.88));
    expect(derive(p, content.illustrations).statusYBand.halfPct).toBe(20);
  });
});
