import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadsService } from './uploads.service';
import { Attendance } from '../entities/attendance.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth-user.interface';
import { UserRole } from '../entities/employee.entity';

/**
 * Menyajikan foto absen. Terproteksi autentikasi + cek kepemilikan:
 * - Admin HRD: boleh melihat semua foto.
 * - Karyawan: hanya foto miliknya sendiri.
 */
@Controller('uploads/photos')
export class UploadsController {
  constructor(
    private readonly uploads: UploadsService,
    @InjectRepository(Attendance)
    private readonly attendances: Repository<Attendance>,
  ) {}

  @Get(':filename')
  async serve(
    @Param('filename') filename: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const attendance = await this.attendances.findOneBy({ photoUrl: filename });
    if (!attendance) throw new NotFoundException('Foto tidak ditemukan');

    if (user.role !== UserRole.HR_ADMIN && attendance.employeeId !== user.sub) {
      throw new ForbiddenException('Anda tidak berhak mengakses foto ini');
    }

    const { buffer, mime } = await this.uploads.readPhoto(filename);
    res.set({
      'Content-Type': mime,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(buffer);
  }
}
