import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
@Index(['actorId'])
@Index(['targetTable'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'actor_id', type: 'int', nullable: true })
  actorId: number | null;

  @Column({ type: 'varchar', name: 'actor_identifier', length: 100, nullable: true })
  actorIdentifier: string | null;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'target_table', length: 50 })
  targetTable: string;

  @Column({ type: 'varchar', name: 'target_id', length: 50, nullable: true })
  targetId: string | null;

  @Column({ type: 'json', nullable: true })
  changes: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
