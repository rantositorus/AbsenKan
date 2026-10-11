import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import sharp from 'sharp';

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;

  constructor(config: ConfigService) {
    this.uploadDir = config.get<string>('UPLOAD_DIR', './uploads');
  }

  /**
   * Simpan buffer foto ke disk. Bila `watermarkText` diberikan, teks timestamp
   * ditempel di pojok kanan-bawah foto sebagai bukti keabsahan (anti-bohong).
   * Mengembalikan nama file relatif.
   */
  async savePhoto(buffer: Buffer, originalName: string, watermarkText?: string): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const ext = extname(originalName).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${randomUUID()}${ext}`;

    let out = buffer;
    if (watermarkText) {
      out = await this.applyWatermark(buffer, watermarkText);
    }

    await fs.writeFile(join(this.uploadDir, filename), out);
    return filename;
  }

  /** Path absolut dari nama file relatif. */
  absolutePath(filename: string): string {
    return join(this.uploadDir, filename);
  }

  async readPhoto(filename: string): Promise<{ buffer: Buffer; mime: string }> {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const path = join(this.uploadDir, safe);
    try {
      const buffer = await fs.readFile(path);
      const mime = this.mimeFromName(safe);
      return { buffer, mime };
    } catch {
      throw new NotFoundException('Foto tidak ditemukan');
    }
  }

  /** Tempel teks timestamp di pojok kanan-bawah via sharp. */
  private async applyWatermark(buffer: Buffer, text: string): Promise<Buffer> {
    const meta = await sharp(buffer).metadata();
    const baseW = meta.width ?? 1920;
    const baseH = meta.height ?? 1080;
    const wmW = Math.max(220, Math.round(baseW * 0.5));
    const wmH = Math.max(34, Math.round(wmW * (64 / 420)));
    const svg = Buffer.from(this.watermarkSvg(wmW, wmH, text));

    // Pastikan canvas cukup besar agar overlay muat (upscale bila perlu).
    if (baseW < wmW || baseH < wmH) {
      const scale = Math.max(wmW / baseW, wmH / baseH);
      return sharp(buffer)
        .resize({
          width: Math.round(baseW * scale),
          height: Math.round(baseH * scale),
          fit: 'fill',
        })
        .composite([{ input: svg, gravity: 'southeast' }])
        .jpeg({ quality: 90 })
        .toBuffer();
    }
    return sharp(buffer)
      .composite([{ input: svg, gravity: 'southeast' }])
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  private watermarkSvg(w: number, h: number, text: string): string {
    const escaped = text.replace(/[<>&'"]/g, (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' })[c] ?? c,
    );
    const fontSize = Math.max(14, Math.round(w / 20));
    const pad = Math.max(6, Math.round(w * 0.03));
    return `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" rx="${Math.round(h * 0.18)}" fill="rgba(0,0,0,0.55)"/>
        <text x="${w / 2}" y="${h / 2 + 2}" font-family="Arial, sans-serif" font-size="${fontSize}"
              font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
          AbsenKan · ${escaped}
        </text>
      </svg>`;
  }

  private mimeFromName(name: string): string {
    const ext = extname(name).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    return 'application/octet-stream';
  }
}