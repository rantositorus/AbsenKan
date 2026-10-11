import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { Attendance, AttendanceType } from '../entities/attendance.entity';
import { NotificationAudience } from '../entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { toWibDateString } from '../common/utils/wib-time';

const WIB = 'Asia/Jakarta';

/**
 * Pengingat otomatis absensi (cron, zona WIB):
 * - 08:30 Senin–Jumat: ingatkan karyawan yang belum absen masuk.
 * - 17:30 Senin–Jumat: ingatkan yang sudah masuk tapi belum pulang.
 * - 21:00 Senin–Jumat: alert HRD daftar karyawan tidak hadir.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    @InjectRepository(Attendance)
    private readonly attendance: Repository<Attendance>,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('30 8 * * 1-5', { timeZone: WIB })
  async remindCheckIn() {
    const date = toWibDateString(new Date());
    if (await this.notifications.exists('check_in_reminder', date)) return;
    const notCheckedIn = await this.notCheckedInToday(date);
    if (notCheckedIn.length === 0) return;

    for (const e of notCheckedIn) {
      await this.notifications.create(NotificationAudience.EMPLOYEE, `Halo ${e.fullName}, jangan lupa absen masuk hari ini.`, {
        type: 'check_in_reminder',
        employeeId: e.id,
        attendanceDate: date,
      });
    }
    this.logger.log(`Reminder check-in dibuat untuk ${notCheckedIn.length} karyawan (${date})`);
  }

  @Cron('30 17 * * 1-5', { timeZone: WIB })
  async remindCheckOut() {
    const date = toWibDateString(new Date());
    if (await this.notifications.exists('check_out_reminder', date)) return;
    const notCheckedOut = await this.checkedInButNotOut(date);
    if (notCheckedOut.length === 0) return;

    for (const e of notCheckedOut) {
      await this.notifications.create(NotificationAudience.EMPLOYEE, `Halo ${e.fullName}, jangan lupa absen pulang hari ini.`, {
        type: 'check_out_reminder',
        employeeId: e.id,
        attendanceDate: date,
      });
    }
    this.logger.log(`Reminder check-out dibuat untuk ${notCheckedOut.length} karyawan (${date})`);
  }

  @Cron('0 21 * * 1-5', { timeZone: WIB })
  async alertNoShow() {
    const date = toWibDateString(new Date());
    if (await this.notifications.exists('no_show_alert', date)) return;
    const notCheckedIn = await this.notCheckedInToday(date);
    if (notCheckedIn.length === 0) return;

    const names = notCheckedIn.map((e) => `${e.fullName} (${e.employeeCode})`).join(', ');
    await this.notifications.create(
      NotificationAudience.HR_ADMIN,
      `Tidak hadir hari ini (${date}): ${names}`,
      { type: 'no_show_alert', attendanceDate: date },
    );
    this.logger.log(`Alert no-show dibuat untuk ${notCheckedIn.length} karyawan (${date})`);
  }

  private async notCheckedInToday(date: string): Promise<Employee[]> {
    const active = await this.employees.find({ where: { isActive: true } });
    const todayRows = await this.attendance.find({
      where: { attendanceDate: date, type: AttendanceType.CHECK_IN },
    });
    const checkedInIds = new Set(todayRows.map((r) => r.employeeId));
    return active.filter((e) => !checkedInIds.has(e.id));
  }

  private async checkedInButNotOut(date: string): Promise<Employee[]> {
    const rows = await this.attendance.find({ where: { attendanceDate: date } });
    const checkedInIds = new Set(
      rows.filter((r) => r.type === AttendanceType.CHECK_IN).map((r) => r.employeeId),
    );
    const checkedOutIds = new Set(
      rows.filter((r) => r.type === AttendanceType.CHECK_OUT).map((r) => r.employeeId),
    );
    const ids = Array.from(checkedInIds).filter((id) => !checkedOutIds.has(id));
    if (ids.length === 0) return [];
    return this.employees.createQueryBuilder('e')
      .where('e.id IN (:...ids)', { ids })
      .getMany();
  }
}