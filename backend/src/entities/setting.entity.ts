import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  /** Kunci unik konfigurasi, misal: check_in_time, check_out_time, lateness_grace_min */
  @PrimaryColumn({ name: 'key', length: 100 })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;
}
