/** Util zona waktu WIB (Asia/Jakarta, UTC+07:00) untuk kebutuhan absensi. */

export const WIB_TZ = 'Asia/Jakarta';

/** Format tanggal WIB 'YYYY-MM-DD' dari sebuah Date (UTC). */
export function toWibDateString(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}`;
}

/** Jam lokal WIB 'HH:MM(SS)' dari Date. */
export function toWibTime(d: Date, withSeconds = false): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: WIB_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return withSeconds ? `${map.hour}:${map.minute}:${map.second}` : `${map.hour}:${map.minute}`;
}

/** Format tampilan 'YYYY-MM-DD HH:MM WIB'. */
export function formatWib(d: Date, withSeconds = false): string {
  return `${toWibDateString(d)} ${toWibTime(d, withSeconds)} WIB`;
}
