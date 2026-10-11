import { toWibDateString, toWibTime, formatWib, WIB_TZ } from './wib-time';

describe('wib-time', () => {
  it('WIB_TZ adalah Asia/Jakarta', () => {
    expect(WIB_TZ).toBe('Asia/Jakarta');
  });

  it('toWibDateString menambah 7 jam (UTC -> WIB)', () => {
    // 2026-10-07 20:00 UTC = 2026-10-08 03:00 WIB
    const d = new Date(Date.UTC(2026, 9, 7, 20, 0, 0));
    expect(toWibDateString(d)).toBe('2026-10-08');
    // 2026-10-08 00:00 UTC = 2026-10-08 07:00 WIB (tanggal sama)
    const d2 = new Date(Date.UTC(2026, 9, 8, 0, 0, 0));
    expect(toWibDateString(d2)).toBe('2026-10-08');
  });

  it('toWibTime mengembalikan HH:MM WIB', () => {
    const d = new Date(Date.UTC(2026, 9, 8, 2, 30, 0)); // 09:30 WIB
    expect(toWibTime(d)).toBe('09:30');
  });

  it('formatWib menyertakan tanggal, jam, dan label WIB', () => {
    const d = new Date(Date.UTC(2026, 9, 8, 2, 30, 0));
    expect(formatWib(d)).toBe('2026-10-08 09:30 WIB');
  });
});
