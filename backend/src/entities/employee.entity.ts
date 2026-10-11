import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  EMPLOYEE = 'employee',
  HR_ADMIN = 'hr_admin',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_code', unique: true, length: 50 })
  employeeCode: string;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position: string | null;

  @Column({ name: 'join_date', type: 'date', nullable: true })
  joinDate: string | null;

  @Column({ type: 'varchar', length: 20, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Column({ name: 'password_hash', length: 100 })
  passwordHash: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
