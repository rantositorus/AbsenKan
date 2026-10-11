import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuthUser } from '../auth/auth-user.interface';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(
    actor: AuthUser | null,
    action: string,
    targetTable: string,
    targetId: string | number | null,
    changes?: Record<string, unknown> | null,
  ): Promise<void> {
    const entry = this.repo.create({
      actorId: actor?.sub ?? null,
      actorIdentifier: actor ? `${actor.code} (${actor.name})` : null,
      action,
      targetTable,
      targetId: targetId != null ? String(targetId) : null,
      changes: changes ?? null,
    });
    await this.repo.save(entry);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    action?: string;
    targetTable?: string;
    actorId?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.action) qb.andWhere('a.action = :action', { action: filters.action });
    if (filters.targetTable)
      qb.andWhere('a.targetTable = :targetTable', { targetTable: filters.targetTable });
    if (filters.actorId) qb.andWhere('a.actorId = :actorId', { actorId: filters.actorId });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
