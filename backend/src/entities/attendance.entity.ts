import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Employee } from './employee.entity';

export enum AttendanceType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
}

export enum AttendanceStatus {
  ON_TIME = 'on_time',
  LATE = 'late',
}

@Entity('attendances')
@Unique(['employeeId', 'attendanceDate', 'type'])
@Index(['attendanceDate'])
@Index(['employeeId'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id', type: 'int' })
  employeeId: number;

  /** Tanggal absen dalam zona waktu WIB (Asia/Jakarta), disimpan sebagai date string (tp format 'YYYY-MM-DD'). */
  @Column({
    name: 'attendance_date',
    type: 'date',
    nullable: false,
  })
  attendanceDate: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  type: AttendanceType;

  /** Timestamp dari server (UTC). */
  @Column({
    name: 'captured_at',
    type: 'datetime',
    nullable: false,
  })
  capturedAt: Date;

  /** Nama file foto (relatif terhadap UPLOAD_DIR). */
  @Column({ name: 'photo_url', length: 255, nullable: true })
  photoUrl: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  mimeType: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
