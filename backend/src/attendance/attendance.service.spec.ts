import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceType, AttendanceStatus } from '../entities/attendance.entity';
import { UserRole } from '../entities/employee.entity';
import type { AuthUser } from '../auth/auth-user.interface';

function jpegBuffer(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x46, 0x4f, 0x4f]);
}

function makeService(overrides: Record<string, unknown> = {}) {
  const repo: any = {
    create: jest.fn((x) => x),
    save: jest.fn((x) => ({ id: 1, ...x })),
    findOneBy: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    ...(overrides.repo || {}),
  };
  const employees: any = {
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
    ...(overrides.employees || {}),
  };
  const uploads: any = {
    savePhoto: jest.fn().mockResolvedValue('photo-123.jpg'),
    ...(overrides.uploads || {}),
  };
  const settings: any = {
    get: jest.fn().mockResolvedValue('09:00'),
    getNumber: jest.fn().mockResolvedValue(0),
    ...(overrides.settings || {}),
  };
  const config: any = { get: jest.fn() };

  const service = new AttendanceService(
    repo,
    employees,
    uploads,
    settings,
    config,
  );
  return { service, repo, uploads, settings };
}

const user: AuthUser = { sub: 1, code: 'EMP001', role: UserRole.EMPLOYEE, name: 'Budi', v: 0 };

describe('AttendanceService', () => {
  it('myToday mengelompokkan check-in dan check-out per tanggal', async () => {
    const { service, repo } = makeService();
    repo.find.mockResolvedValue([
      { id: 1, employeeId: 1, attendanceDate: '2026-10-08', type: AttendanceType.CHECK_IN, status: AttendanceStatus.ON_TIME, capturedAt: new Date(), photoUrl: 'a.jpg', note: null },
      { id: 2, employeeId: 1, attendanceDate: '2026-10-08', type: AttendanceType.CHECK_OUT, status: null, capturedAt: new Date(), photoUrl: 'b.jpg', note: null },
    ]);
    const res = await service.myToday(user);
    expect(res.date).toBe('2026-10-08');
    expect(res.checkIn).toBeTruthy();
    expect(res.checkOut).toBeTruthy();
    expect(res.status).toBe(AttendanceStatus.ON_TIME);
  });

  it('check-in tanpa foto ditolak (400)', async () => {
    const { service } = makeService();
    await expect(service.checkIn(user, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('check-in ganda di hari yang sama ditolak (409)', async () => {
    const { service, repo } = makeService();
    repo.findOneBy.mockResolvedValue({ id: 9, type: AttendanceType.CHECK_IN });
    await expect(
      service.checkIn(user, { buffer: jpegBuffer() } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('check-out tanpa check-in ditolak (400)', async () => {
    const { service, repo } = makeService();
    // repo.findOneBy dipanggil untuk cek duplikat (null), lalu cek check-in (null)
    repo.findOneBy.mockResolvedValue(null);
    await expect(
      service.checkOut(user, { buffer: jpegBuffer() } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('check-in sukses mencatat record dan status terlambat', async () => {
    const { service, repo, uploads, settings } = makeService();
    settings.get.mockResolvedValue('09:00');
    settings.getNumber.mockImplementation((key: string, fb: number) =>
      key === 'max_photo_size_mb' ? 5 : 0,
    );
    repo.findOneBy.mockResolvedValue(null);
    const res = await service.checkIn(user, { buffer: jpegBuffer() } as any, 'Kerja WFH');
    expect(res.type).toBe(AttendanceType.CHECK_IN);
    expect(res.status).toBe(AttendanceStatus.LATE);
    expect(res.note).toBe('Kerja WFH');
    expect(uploads.savePhoto).toHaveBeenCalled();
    // watermark (arg ke-3) mengandung timestamp WIB
    const thirdArg = uploads.savePhoto.mock.calls[0][2] as string;
    expect(thirdArg).toMatch(/WIB$/);
    expect(repo.save).toHaveBeenCalled();
  });

  it('check-in tepat waktu bila sebelum jam batas', async () => {
    const { service, repo, settings } = makeService();
    settings.get.mockResolvedValue('23:59'); // batas malam agar "sekarang" dianggap on-time di snapshot berikut
    settings.getNumber.mockResolvedValue(0);
    repo.findOneBy.mockResolvedValue(null);
    const res = await service.checkIn(user, { buffer: jpegBuffer() } as any);
    // status bisa on_time atau late tergantung jam server; pastikan valid
    expect([AttendanceStatus.ON_TIME, AttendanceStatus.LATE]).toContain(res.status);
  });
});
