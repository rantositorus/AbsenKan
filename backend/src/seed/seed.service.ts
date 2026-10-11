import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Employee, UserRole } from '../entities/employee.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    private readonly settings: SettingsService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.settings.ensureDefaults();
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const identifier = this.config.get<string>('SEED_ADMIN_IDENTIFIER', 'admin');
    const existing = await this.employees
      .createQueryBuilder('e')
      .where('LOWER(e.employeeCode) = LOWER(:c)', { c: identifier })
      .orWhere('LOWER(e.email) = LOWER(:c)', { c: identifier })
      .getOne();
    if (existing) return;

    const password = this.config.get<string>('SEED_ADMIN_PASSWORD', 'Admin#12345');
    const admin = this.employees.create({
      employeeCode: identifier,
      fullName: this.config.get<string>('SEED_ADMIN_NAME', 'Admin HRD'),
      email: `${identifier}@absenkan.local`,
      phone: null,
      department: this.config.get<string>('SEED_ADMIN_DEPARTMENT', 'HRD'),
      position: this.config.get<string>('SEED_ADMIN_POSITION', 'HR Manager'),
      joinDate: null,
      role: UserRole.HR_ADMIN,
      isActive: true,
      passwordHash: await bcrypt.hash(password, 10),
    });
    await this.employees.save(admin);
    this.logger.log(`Admin HRD seed dibuat: ${identifier}`);
  }
}
