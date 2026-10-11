import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Attendance, AttendanceType, AttendanceStatus } from '../entities/attendance.entity';
import { Employee } from '../entities/employee.entity';
import { UploadsService } from '../uploads/uploads.service';
import { SettingsService } from '../settings/settings.service';
import { AuthUser } from '../auth/auth-user.interface';
import { validatePhoto } from './photo-validator';
import { toWibDateString, toWibTime, formatWib } from '../common/utils/wib-time';
import * as ExcelJS from 'exceljs';

export interface AttendanceFilters {
  from?: string;
  to?: string;
  employeeId?: number;
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    private readonly uploads: UploadsService,
    private readonly settings: SettingsService,
    private readonly config: ConfigService,
  ) {}

  async checkIn(user: AuthUser, file: Express.Multer.File | undefined, note?: string) {
    return this.record(user, AttendanceType.CHECK_IN, file, note);
  }

  async checkOut(user: AuthUser, file: Express.Multer.File | undefined, note?: string) {
    return this.record(user, AttendanceType.CHECK_OUT, file, note);
  }

  private async record(
    user: AuthUser,
    type: AttendanceType,
    file: Express.Multer.File | undefined,
    note?: string,
  ) {
    const now = new Date();
    const attendanceDate = toWibDateString(now);

    // Validasi foto
    const check = validatePhoto(file?.buffer);
    if (!check.ok) throw new BadRequestException(check.reason);
    const maxMb = await this.settings.getNumber('max_photo_size_mb', 5);
    if (file!.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`Ukuran foto melebihi batas ${maxMb} MB`);
    }

    // Cek duplikasi (satu check-in & satu check-out per hari)
    const existing = await this.repo.findOneBy({
      employeeId: user.sub,
      attendanceDate,
      type,
    });
    if (existing) {
      throw new ConflictException(
        type === AttendanceType.CHECK_IN
          ? 'Anda sudah absen masuk hari ini'
          : 'Anda sudah absen pulang hari ini',
      );
    }

    // Absen pulang wajib ada absen masuk dulu
    if (type === AttendanceType.CHECK_OUT) {
      const checkIn = await this.repo.findOneBy({
        employeeId: user.sub,
        attendanceDate,
        type: AttendanceType.CHECK_IN,
      });
      if (!checkIn) {
        throw new BadRequestException('Anda belum absen masuk hari ini');
      }
    }

    const filename = await this.uploads.savePhoto(
      file!.buffer,
      `photo${check.ext}`,
      formatWib(now, true),
    );
    const status = type === AttendanceType.CHECK_IN ? await this.computeStatus(now) : null;

    const record = this.repo.create({
      employeeId: user.sub,
      attendanceDate,
      type,
      capturedAt: now,
      photoUrl: filename,
      mimeType: check.mime,
      note: note?.trim() || null,
      status,
    } as DeepPartial<Attendance>);
    const saved = await this.repo.save(record);

    return {
      id: saved.id,
      type: saved.type,
      attendanceDate: saved.attendanceDate,
      capturedAt: saved.capturedAt,
      capturedAtWib: formatWib(saved.capturedAt, true),
      status: saved.status,
      note: saved.note,
      photoUrl: saved.photoUrl,
    };
  }

  private async computeStatus(capturedAt: Date): Promise<AttendanceStatus> {
    const checkInTime = (await this.settings.get('check_in_time')) || '09:00';
    const graceMin = await this.settings.getNumber('lateness_grace_min', 0);
    const captured = toWibTime(capturedAt); // 'HH:MM'
    const limit = this.addMinutes(checkInTime, graceMin);
    return captured <= limit ? AttendanceStatus.ON_TIME : AttendanceStatus.LATE;
  }

  private addMinutes(hhmm: string, minutes: number): string {
    const [h, m] = hhmm.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  }

  /** Status absen hari ini untuk karyawan. */
  async myToday(user: AuthUser) {
    const date = toWibDateString(new Date());
    const rows = await this.repo.find({
      where: { employeeId: user.sub, attendanceDate: date },
      order: { type: 'ASC' },
    });
    const checkIn = rows.find((r) => r.type === AttendanceType.CHECK_IN) ?? null;
    const checkOut = rows.find((r) => r.type === AttendanceType.CHECK_OUT) ?? null;
    return {
      date,
      checkIn: checkIn ? this.serialize(checkIn) : null,
      checkOut: checkOut ? this.serialize(checkOut) : null,
      status: checkIn ? checkIn.status : null,
    };
  }

  /** Riwayat absensi milik karyawan sendiri, filter bulan. */
  async myHistory(user: AuthUser, month?: string) {
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.employeeId = :id', { id: user.sub })
      .orderBy('a.attendanceDate', 'DESC')
      .addOrderBy('a.type', 'ASC');

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      qb.andWhere('a.attendanceDate LIKE :prefix', { prefix: `${month}-%` });
    }
    const rows = await qb.getMany();
    return rows.map((r) => this.serialize(r));
  }

  /** Monitoring admin: per (karyawan, tanggal) dengan jam masuk & pulang. */
  async monitoring(filters: AttendanceFilters) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const qb = this.repo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.employee', 'e')
      .orderBy('a.attendanceDate', 'DESC')
      .addOrderBy('e.fullName', 'ASC');

    if (filters.from) qb.andWhere('a.attendanceDate >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('a.attendanceDate <= :to', { to: filters.to });
    if (filters.employeeId) qb.andWhere('a.employeeId = :eid', { eid: filters.employeeId });
    if (filters.department)
      qb.andWhere('LOWER(e.department) = LOWER(:dept)', { dept: filters.department });
    if (filters.status) qb.andWhere('a.status = :st', { st: filters.status });
    if (filters.search) {
      qb.andWhere(
        '(LOWER(e.fullName) LIKE :q OR LOWER(e.employeeCode) LIKE :q)',
        { q: `%${filters.search.toLowerCase()}%` },
      );
    }

    const rows = await qb.getMany();
    const grouped = this.groupByDay(rows);
    const total = grouped.length;
    const start = (page - 1) * limit;
    const items = grouped.slice(start, start + limit);
    return { items, total, page, limit };
  }

  private groupByDay(rows: Attendance[]) {
    const map = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.employeeId}|${r.attendanceDate}`;
      if (!map.has(key)) {
        map.set(key, {
          id: r.id,
          attendanceDate: r.attendanceDate,
          employeeId: r.employeeId,
          employeeCode: r.employee?.employeeCode,
          fullName: r.employee?.fullName,
          department: r.employee?.department,
          position: r.employee?.position,
          checkIn: null,
          checkOut: null,
          status: null,
        });
      }
      const row = map.get(key);
      if (r.type === AttendanceType.CHECK_IN) {
        row.checkIn = this.serialize(r);
        row.status = r.status;
      } else {
        row.checkOut = this.serialize(r);
      }
    }
    return Array.from(map.values());
  }

  /** Dashboard ringkasan harian untuk admin. */
  async dashboardSummary() {
    const date = toWibDateString(new Date());
    const active = await this.employees.count({ where: { isActive: true } });

    const todayRows = await this.repo.find({
      where: { attendanceDate: date, type: AttendanceType.CHECK_IN },
      relations: ['employee'],
    });
    const checkedInIds = new Set(todayRows.map((r) => r.employeeId));
    const late = todayRows.filter((r) => r.status === AttendanceStatus.LATE).length;

    const notYet = await this.employees
      .createQueryBuilder('e')
      .where('e.isActive = true')
      .andWhere('e.id NOT IN (:...ids)', {
        ids: checkedInIds.size ? Array.from(checkedInIds) : [0],
      })
      .orderBy('e.fullName', 'ASC')
      .getMany();

    return {
      date,
      activeEmployees: active,
      checkedIn: checkedInIds.size,
      late,
      notYetCheckedIn: notYet.length,
      notYetList: notYet.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        fullName: e.fullName,
        department: e.department,
      })),
    };
  }

  /** Ekspor CSV dari hasil filter (tanpa foto, berisi tautan foto). */
  async exportCsv(filters: AttendanceFilters): Promise<string> {
    const rows = await this.monitoring({ ...filters, page: 1, limit: 100000 });
    const header = [
      'Tanggal',
      'ID Karyawan',
      'Nama',
      'Departemen',
      'Jabatan',
      'Jam Masuk',
      'Jam Pulang',
      'Status',
      'Catatan Masuk',
      'Catatan Pulang',
      'Foto Masuk',
      'Foto Pulang',
    ];
    const lines = [header.join(',')];
    for (const r of rows.items) {
      const esc = (v: unknown) => {
        const s = v == null ? '' : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };
      lines.push(
        [
          esc(r.attendanceDate),
          esc(r.employeeCode),
          esc(r.fullName),
          esc(r.department),
          esc(r.position),
          esc(r.checkIn ? toWibTime(r.checkIn.capturedAt) : ''),
          esc(r.checkOut ? toWibTime(r.checkOut.capturedAt) : ''),
          esc(r.status ?? ''),
          esc(r.checkIn?.note ?? ''),
          esc(r.checkOut?.note ?? ''),
          esc(r.checkIn?.photoUrl ?? ''),
          esc(r.checkOut?.photoUrl ?? ''),
        ].join(','),
      );
    }
    return lines.join('\n');
  }

  /** Ekspor Excel (.xlsx) dari hasil filter. */
  async exportExcel(filters: AttendanceFilters): Promise<Buffer> {
    const rows = await this.monitoring({ ...filters, page: 1, limit: 100000 });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Absensi');
    ws.columns = [
      { header: 'Tanggal', key: 'date', width: 14 },
      { header: 'ID Karyawan', key: 'code', width: 14 },
      { header: 'Nama', key: 'name', width: 24 },
      { header: 'Departemen', key: 'dept', width: 16 },
      { header: 'Jabatan', key: 'pos', width: 16 },
      { header: 'Jam Masuk', key: 'in', width: 10 },
      { header: 'Jam Pulang', key: 'out', width: 10 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Catatan Masuk', key: 'noteIn', width: 20 },
      { header: 'Catatan Pulang', key: 'noteOut', width: 20 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const r of rows.items) {
      ws.addRow({
        date: r.attendanceDate,
        code: r.employeeCode,
        name: r.fullName,
        dept: r.department ?? '',
        pos: r.position ?? '',
        in: r.checkIn ? toWibTime(r.checkIn.capturedAt) : '',
        out: r.checkOut ? toWibTime(r.checkOut.capturedAt) : '',
        status: r.status ?? '',
        noteIn: r.checkIn?.note ?? '',
        noteOut: r.checkOut?.note ?? '',
      });
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  /** Rekap bulanan per karyawan: hadir, terlambat, tidak hadir. */
  async monthlyRecap(month: string) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('Format bulan tidak valid (YYYY-MM)');
    }
    const activeEmployees = await this.employees.find({
      where: { isActive: true },
      order: { fullName: 'ASC' },
    });
    const rows = await this.repo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.employee', 'e')
      .where('a.attendanceDate LIKE :prefix', { prefix: `${month}-%` })
      .getMany();

    const workingDays = this.workingDaysInMonth(month);
    const byEmployee = new Map<number, { present: number; late: number }>();
    for (const r of rows) {
      if (r.type !== AttendanceType.CHECK_IN) continue;
      const cur = byEmployee.get(r.employeeId) ?? { present: 0, late: 0 };
      cur.present += 1;
      if (r.status === AttendanceStatus.LATE) cur.late += 1;
      byEmployee.set(r.employeeId, cur);
    }

    return {
      month,
      workingDays,
      items: activeEmployees.map((e) => {
        const stat = byEmployee.get(e.id) ?? { present: 0, late: 0 };
        return {
          employeeId: e.id,
          employeeCode: e.employeeCode,
          fullName: e.fullName,
          department: e.department,
          position: e.position,
          presentDays: stat.present,
          lateDays: stat.late,
          absentDays: Math.max(0, workingDays - stat.present),
        };
      }),
    };
  }

  /** Jumlah hari kerja (Senin–Jumat) dalam satu bulan YYYY-MM. */
  private workingDaysInMonth(month: string): number {
    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(y, m - 1, d).getDay();
      if (day !== 0 && day !== 6) count += 1;
    }
    return count;
  }

  private serialize(r: Attendance) {
    return {
      id: r.id,
      type: r.type,
      attendanceDate: r.attendanceDate,
      capturedAt: r.capturedAt,
      capturedAtWib: formatWib(r.capturedAt, true),
      status: r.status,
      note: r.note,
      photoUrl: r.photoUrl,
    };
  }
}
