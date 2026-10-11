import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationAudience,
} from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  /** Buat notifikasi (dipakai service reminder). */
  async create(
    audience: NotificationAudience,
    message: string,
    opts: { type: string; employeeId?: number | null; attendanceDate?: string | null } = { type: 'general' },
  ): Promise<Notification> {
    const n = this.repo.create({
      audience,
      message,
      type: opts.type,
      employeeId: opts.employeeId ?? null,
      attendanceDate: opts.attendanceDate ?? null,
      read: false,
    });
    return this.repo.save(n);
  }

  /** Cek apakah sudah ada notifikasi jenis+tanggal yang sama (dedup cron). */
  async exists(type: string, attendanceDate: string | null): Promise<boolean> {
    const where: Record<string, unknown> = { type };
    if (attendanceDate) where.attendanceDate = attendanceDate;
    return this.repo.exist({ where } as never);
  }

  /** Daftar notifikasi untuk admin. */
  async findAll(filters: { page?: number; limit?: number; audience?: string; read?: string }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const qb = this.repo.createQueryBuilder('n').orderBy('n.createdAt', 'DESC');

    if (filters.audience) qb.andWhere('n.audience = :a', { a: filters.audience });
    if (filters.read === 'true') qb.andWhere('n.read = true');
    if (filters.read === 'false') qb.andWhere('n.read = false');

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  /** Tandai satu notifikasi sebagai dibaca. */
  async markRead(id: number): Promise<Notification> {
    const n = await this.repo.findOneBy({ id });
    if (!n) throw new NotFoundException('Notifikasi tidak ditemukan');
    n.read = true;
    return this.repo.save(n);
  }

  /** Tandai semua notifikasi sebagai dibaca. */
  async markAllRead(): Promise<{ message: string }> {
    await this.repo.update({ read: false }, { read: true });
    return { message: 'Semua notifikasi ditandai dibaca' };
  }
}