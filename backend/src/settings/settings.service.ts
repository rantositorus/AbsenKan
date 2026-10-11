import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

export const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  check_in_time: { value: '09:00', description: 'Jam batas masuk (WIB). Absen masuk setelah ini dianggap terlambat.' },
  check_out_time: { value: '18:00', description: 'Jam pulang standar (WIB).' },
  lateness_grace_min: { value: '0', description: 'Toleransi keterlambatan dalam menit (0 = tanpa toleransi).' },
  max_photo_size_mb: { value: '5', description: 'Batas maksimal ukuran foto (MB).' },
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
  ) {}

  async ensureDefaults(): Promise<void> {
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      const exists = await this.repo.findOneBy({ key });
      if (!exists) {
        await this.repo.save(this.repo.create({ key, value: def.value, description: def.description }));
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const row = await this.repo.findOneBy({ key });
    return row?.value ?? null;
  }

  async getNumber(key: string, fallback: number): Promise<number> {
    const v = await this.get(key);
    if (v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.repo.find();
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value ?? '';
    return out;
  }

  async set(key: string, value: string): Promise<Setting> {
    let row = await this.repo.findOneBy({ key });
    if (!row) {
      row = this.repo.create({ key, value, description: null });
    } else {
      row.value = value;
    }
    return this.repo.save(row);
  }
}
