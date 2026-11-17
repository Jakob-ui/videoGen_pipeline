// Graph snapshots (AGENT.md §11.1): guarantees that the graphs stay the same.
// Update deliberately with: npx ng test --watch=false --update
import { buildContext } from '../../model/context';
import { resolveDeep } from '../../template/template';
import { loadContent, loadMockProduct } from '../../../testing/fixtures';
import { examplesVm, payoffVm, statusVm } from '../chart-vms';
import { buildExamplesOption } from './examples.option';
import { buildPayoffOption } from './payoff.option';
import { buildStatusOption } from './status.option';

const content = loadContent();
const ctx = buildContext(loadMockProduct(), content);
const screen = (id: string) => resolveDeep(content.slides[id].screen, ctx, 'display') as Record<string, string>;
const all = (keys: string[], p: number) => Object.fromEntries(keys.map((k) => [k, p])) as never;

/** Replace functions with their output for a few sample values, so labels are covered too. */
function serializable(option: unknown, samples: number[]): unknown {
  return JSON.parse(
    JSON.stringify(option, (_k, v) => (typeof v === 'function' ? samples.map((s) => v(s)) : v)),
  );
}

const PROGRESS = [0, 0.5, 1];

describe('graph snapshots', () => {
  for (const p of PROGRESS) {
    it(`payoff @ ${p}`, () => {
      const keys = ['axes', 'upper', 'upperLabel', 'lower', 'lowerLabel', 'mid', 'midLabel'];
      const option = buildPayoffOption(payoffVm(ctx, screen('s05-auszahlungsprofil')), all(keys, p));
      expect(serializable(option, [-40, 0, 40, 100])).toMatchSnapshot();
    });

    it(`examples @ ${p}`, () => {
      const keys = ['axes', 'pathA', 'resultA', 'dimA', 'pathB', 'resultB'];
      const option = buildExamplesOption(examplesVm(ctx, screen('s06-beispiele')), all(keys, p));
      expect(serializable(option, [-40, 0, 20])).toMatchSnapshot();
    });

    it(`status @ ${p}`, () => {
      const keys = ['axes', 'line', 'today', 'badge', 'zoomOut'];
      const option = buildStatusOption(statusVm(ctx, screen('s07-status')), all(keys, p));
      expect(serializable(option, [Date.UTC(2026, 6, 1), 5])).toMatchSnapshot();
    });

  }

  it('status chart falls back to a simplified line without history', () => {
    const noHistory = buildContext({ ...loadMockProduct(), history: undefined }, content);
    const option = buildStatusOption(statusVm(noHistory, screen('s07-status')), all(['line'], 1));
    expect(option.series.map((s) => s.id)).toContain('simplified');
  });
});
