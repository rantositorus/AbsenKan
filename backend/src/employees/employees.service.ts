import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Employee, UserRole } from '../entities/employee.entity';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth-user.interface';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
    private readonly audit: AuditService,
  ) {}

  async create(actor: AuthUser, dto: CreateEmployeeDto) {
    await this.assertUnique(dto.employeeCode, dto.email);

    const employee = this.repo.create({
      employeeCode: dto.employeeCode.trim(),
      fullName: dto.fullName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone ?? null,
      department: dto.department ?? null,
      position: dto.position ?? null,
      joinDate: dto.joinDate ?? null,
      role: dto.role ?? UserRole.EMPLOYEE,
      isActive: dto.isActive ?? true,
      passwordHash: await bcrypt.hash(dto.password, 10),
    });
    const saved = await this.repo.save(employee);

    await this.audit.log(actor, 'CREATE', 'employees', saved.id, {
      employeeCode: saved.employeeCode,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
    });
    return this.sanitize(saved);
  }

  async update(actor: AuthUser, id: number, dto: UpdateEmployeeDto) {
    const employee = await this.repo.findOneBy({ id });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');

    if (dto.employeeCode && dto.employeeCode !== employee.employeeCode) {
      await this.assertUnique(dto.employeeCode, undefined, id);
    }
    if (dto.email && dto.email.toLowerCase() !== employee.email) {
      await this.assertUnique(undefined, dto.email, id);
    }

    const before = this.snapshot(employee);
    if (dto.employeeCode !== undefined) employee.employeeCode = dto.employeeCode.trim();
    if (dto.fullName !== undefined) employee.fullName = dto.fullName.trim();
    if (dto.email !== undefined) employee.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) employee.phone = dto.phone ?? null;
    if (dto.department !== undefined) employee.department = dto.department ?? null;
    if (dto.position !== undefined) employee.position = dto.position ?? null;
    if (dto.joinDate !== undefined) employee.joinDate = dto.joinDate ?? null;
    if (dto.role !== undefined) employee.role = dto.role;
    if (dto.isActive !== undefined) employee.isActive = dto.isActive;

    const saved = await this.repo.save(employee);
    const after = this.snapshot(saved);
    const changes = this.diff(before, after);
    if (Object.keys(changes).length > 0) {
      await this.audit.log(actor, 'UPDATE', 'employees', saved.id, changes);
    }
    return this.sanitize(saved);
  }

  async setActive(actor: AuthUser, id: number, isActive: boolean) {
    const employee = await this.repo.findOneBy({ id });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');
    if (employee.isActive === isActive) {
      return this.sanitize(employee);
    }
    employee.isActive = isActive;
    const saved = await this.repo.save(employee);
    await this.audit.log(actor, isActive ? 'ACTIVATE' : 'DEACTIVATE', 'employees', saved.id, {
      isActive,
    });
    return this.sanitize(saved);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    status?: string;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const qb = this.repo.createQueryBuilder('e').orderBy('e.fullName', 'ASC');

    if (filters.search) {
      qb.andWhere(
        '(LOWER(e.fullName) LIKE :q OR LOWER(e.employeeCode) LIKE :q OR LOWER(e.email) LIKE :q)',
        { q: `%${filters.search.toLowerCase()}%` },
      );
    }
    if (filters.department) {
      qb.andWhere('LOWER(e.department) = LOWER(:dept)', { dept: filters.department });
    }
    if (filters.status === 'active') qb.andWhere('e.isActive = true');
    if (filters.status === 'inactive') qb.andWhere('e.isActive = false');

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((e) => this.sanitize(e)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    const employee = await this.repo.findOneBy({ id });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');
    return this.sanitize(employee);
  }

  async findDepartments(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('e')
      .select('DISTINCT e.department', 'department')
      .where('e.department IS NOT NULL')
      .andWhere("e.department <> ''")
      .orderBy('e.department', 'ASC')
      .getRawMany();
    return rows
      .map((r) => r.department)
      .filter((d): d is string => Boolean(d));
  }

  async resetPassword(actor: AuthUser, id: number, newPassword: string) {
    const employee = await this.repo.findOneBy({ id });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');
    employee.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.save(employee);
    await this.audit.log(actor, 'RESET_PASSWORD', 'employees', id, {});
    return { message: 'Password berhasil di-reset' };
  }

  private async assertUnique(code?: string, email?: string, excludeId?: number) {
    if (code) {
      const dup = await this.repo
        .createQueryBuilder('e')
        .where('LOWER(e.employeeCode) = LOWER(:c)', { c: code.trim() })
        .andWhere(excludeId ? 'e.id != :id' : '1=1', excludeId ? { id: excludeId } : {})
        .getOne();
      if (dup) throw new ConflictException('ID/NIK karyawan sudah digunakan');
    }
    if (email) {
      const dup = await this.repo
        .createQueryBuilder('e')
        .where('LOWER(e.email) = LOWER(:em)', { em: email.trim().toLowerCase() })
        .andWhere(excludeId ? 'e.id != :id' : '1=1', excludeId ? { id: excludeId } : {})
        .getOne();
      if (dup) throw new ConflictException('Email sudah digunakan');
    }
  }

  private snapshot(e: Employee) {
    return {
      employeeCode: e.employeeCode,
      fullName: e.fullName,
      email: e.email,
      phone: e.phone,
      department: e.department,
      position: e.position,
      joinDate: e.joinDate,
      role: e.role,
      isActive: e.isActive,
    };
  }

  private diff(before: Record<string, unknown>, after: Record<string, unknown>) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(after)) {
      if (before[k] !== after[k]) out[k] = { from: before[k], to: after[k] };
    }
    return out;
  }

  private sanitize(e: Employee) {
    const { passwordHash, ...rest } = e;
    return rest;
  }
}
