import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Employee, UserRole } from '../entities/employee.entity';
import { LoginThrottleService } from './login-throttle.service';
import { JwtPayload } from './auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly throttle: LoginThrottleService,
  ) {}

  async login(identifier: string, password: string) {
    const lock = this.throttle.isLocked(identifier);
    if (lock.locked) {
      throw new UnauthorizedException(
        `Terlalu banyak percobaan. Coba lagi dalam ${lock.retryAfterMin} menit.`,
      );
    }

    const employee = await this.findByIdentifier(identifier);
    if (!employee) {
      this.throttle.recordFailure(identifier);
      throw new UnauthorizedException('ID/email atau password salah');
    }

    if (!employee.isActive) {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Hubungi HRD.');
    }

    const ok = await bcrypt.compare(password, employee.passwordHash);
    if (!ok) {
      const res = this.throttle.recordFailure(identifier);
      if (res.locked) {
        throw new UnauthorizedException(
          `Terlalu banyak percobaan. Akun terkunci sementara.`,
        );
      }
      throw new UnauthorizedException('ID/email atau password salah');
    }

    this.throttle.clear(identifier);
    const payload: JwtPayload = {
      sub: employee.id,
      code: employee.employeeCode,
      role: employee.role,
      name: employee.fullName,
    };
    const token = await this.jwt.signAsync(payload);
    return { token, user: this.sanitize(employee) };
  }

  async me(id: number) {
    const employee = await this.employees.findOneBy({ id });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');
    return this.sanitize(employee);
  }

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const employee = await this.employees.findOneBy({ id });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');

    const ok = await bcrypt.compare(currentPassword, employee.passwordHash);
    if (!ok) throw new BadRequestException('Password saat ini salah');

    employee.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.employees.save(employee);
    return { message: 'Password berhasil diubah' };
  }

  async resetPassword(id: number, newPassword: string) {
    const employee = await this.employees.findOneBy({ id });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');
    employee.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.employees.save(employee);
    return { message: 'Password berhasil di-reset' };
  }

  private async findByIdentifier(identifier: string): Promise<Employee | null> {
    const q = identifier.trim();
    return this.employees
      .createQueryBuilder('e')
      .where('LOWER(e.employeeCode) = LOWER(:q)', { q })
      .orWhere('LOWER(e.email) = LOWER(:q)', { q })
      .getOne();
  }

  private sanitize(e: Employee) {
    const { passwordHash, ...rest } = e;
    return rest;
  }
}
