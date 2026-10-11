import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationAudience {
  HR_ADMIN = 'hr_admin',
  EMPLOYEE = 'employee',
  ALL = 'all',
}

@Entity('notifications')
@Index(['audience'])
@Index(['attendanceDate'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  /** Penerima: hr_admin, employee, atau all. */
  @Column({ type: 'varchar', length: 20 })
  audience: NotificationAudience;

  /** ID karyawan penerima (null bila ditujukan ke HRD/all). */
  @Column({ name: 'employee_id', type: 'int', nullable: true })
  employeeId: number | null;

  /** Jenis notifikasi, mis. check_in_reminder, check_out_reminder, no_show_alert. */
  @Column({ type: 'varchar', length: 50 })
  type: string;

  /** Tanggal absen terkait (YYYY-MM-DD) untuk dedup. */
  @Column({ name: 'attendance_date', type: 'varchar', length: 10, nullable: true })
  attendanceDate: string | null;

  @Column({ type: 'varchar', length: 255 })
  message: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}