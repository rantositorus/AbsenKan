import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AttendanceService, AttendanceFilters } from './attendance.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../auth/auth-user.interface';
import { UserRole } from '../entities/employee.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('check-in')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  checkIn(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('note') note?: string,
  ) {
    return this.attendance.checkIn(user, file, note);
  }

  @Post('check-out')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  checkOut(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('note') note?: string,
  ) {
    return this.attendance.checkOut(user, file, note);
  }

  @Get('today')
  myToday(@CurrentUser() user: AuthUser) {
    return this.attendance.myToday(user);
  }

  @Get('history')
  myHistory(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.attendance.myHistory(user, month);
  }

  @Roles(UserRole.HR_ADMIN)
  @Get('monitoring')
  monitoring(@Query() q: Record<string, string>) {
    return this.attendance.monitoring(this.parseFilters(q));
  }

  @Roles(UserRole.HR_ADMIN)
  @Get('dashboard')
  dashboard() {
    return this.attendance.dashboardSummary();
  }

  @Roles(UserRole.HR_ADMIN)
  @Get('export')
  async export(@Query() q: Record<string, string>, @Res() res: Response) {
    const csv = await this.attendance.exportCsv(this.parseFilters(q));
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rekap-absensi.csv"',
    });
    res.send('\uFEFF' + csv); // BOM agar Excel membaca UTF-8 dengan benar
  }

  @Roles(UserRole.HR_ADMIN)
  @Get('export-excel')
  async exportExcel(@Query() q: Record<string, string>, @Res() res: Response) {
    const buf = await this.attendance.exportExcel(this.parseFilters(q));
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="rekap-absensi.xlsx"',
    });
    res.send(buf);
  }

  @Roles(UserRole.HR_ADMIN)
  @Get('recap')
  async recap(@Query('month') month?: string) {
    return this.attendance.monthlyRecap(month ?? this.currentMonth());
  }

  private parseFilters(q: Record<string, string>): AttendanceFilters {
    return {
      from: q.from,
      to: q.to,
      employeeId: q.employeeId ? parseInt(q.employeeId, 10) : undefined,
      department: q.department,
      status: q.status,
      search: q.search,
      page: q.page ? parseInt(q.page, 10) : undefined,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
    };
  }

  private currentMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
