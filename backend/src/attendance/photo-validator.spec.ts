import { validatePhoto } from './photo-validator';

describe('validatePhoto', () => {
  it('menolak bila buffer kosong / undefined', () => {
    expect(validatePhoto(undefined).ok).toBe(false);
    expect(validatePhoto(Buffer.alloc(0)).ok).toBe(false);
  });

  it('menerima JPEG (magic bytes FF D8 FF)', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const res = validatePhoto(jpeg);
    expect(res.ok).toBe(true);
    expect(res.mime).toBe('image/jpeg');
    expect(res.ext).toBe('.jpg');
  });

  it('menerima PNG (magic bytes 89 50 4E 47)', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const res = validatePhoto(png);
    expect(res.ok).toBe(true);
    expect(res.mime).toBe('image/png');
  });

  it('menolak tipe bukan gambar', () => {
    const text = Buffer.from('hello world not an image');
    const res = validatePhoto(text);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('tidak didukung');
  });
});
