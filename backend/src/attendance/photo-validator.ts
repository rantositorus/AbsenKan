/** Validasi tipe foto via magic bytes (bukan hanya ekstensi). */

export interface PhotoCheck {
  ok: boolean;
  mime?: string;
  ext?: string;
  reason?: string;
}

const ALLOWED: { mime: string; ext: string; magic: number[] }[] = [
  { mime: 'image/jpeg', ext: '.jpg', magic: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: '.png', magic: [0x89, 0x50, 0x4e, 0x47] },
];

export function validatePhoto(buffer: Buffer | undefined): PhotoCheck {
  if (!buffer || buffer.length === 0) {
    return { ok: false, reason: 'Foto wajib ada' };
  }
  for (const t of ALLOWED) {
    if (buffer.length >= t.magic.length && t.magic.every((b, i) => buffer[i] === b)) {
      return { ok: true, mime: t.mime, ext: t.ext };
    }
  }
  return { ok: false, reason: 'Format foto tidak didukung. Gunakan JPG, JPEG, atau PNG.' };
}
