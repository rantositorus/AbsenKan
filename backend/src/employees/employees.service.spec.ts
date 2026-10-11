import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { UserRole } from '../entities/employee.entity';
import type { AuthUser } from '../auth/auth-user.interface';

const admin: AuthUser = { sub: 1, code: 'admin', role: UserRole.HR_ADMIN, name: 'Admin' };

function mockQueryBuilder(existing: unknown = null) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(existing),
  };
}

function makeService(existingEmployee: any = null) {
  const repo: any = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 5, ...x })),
    findOneBy: jest.fn().mockResolvedValue(existingEmployee),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder()),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new EmployeesService(repo, audit as any);
  return { service, repo, audit };
}

describe('EmployeesService', () => {
  it('create menyimpan karyawan tanpa passwordHash pada respons', async () => {
    const { service, repo, audit } = makeService();
    const res = await service.create(admin, {
      employeeCode: 'EMP100',
      fullName: 'Andi',
      email: 'andi@absenkan.local',
      phone: '0812',
      department: 'IT',
      position: 'Dev',
      joinDate: '2026-10-01',
      password: 'Rahasia#123',
    } as any);
    expect(res.id).toBe(5);
    expect(res).not.toHaveProperty('passwordHash');
    expect(res.fullName).toBe('Andi');
    expect(repo.save).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(admin, 'CREATE', 'employees', 5, expect.any(Object));
    expect(audit.log.mock.calls[0][4].employeeCode).toBe('EMP100');
  });

  it('create menolak employeeCode duplikat (409)', async () => {
    const { service, repo } = makeService();
    repo.createQueryBuilder.mockReturnValue(mockQueryBuilder({ id: 1 }));
    await expect(
      service.create(admin, {
        employeeCode: 'DUP',
        fullName: 'X',
        email: 'x@absenkan.local',
        password: 'Password#123',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('update mengubah data bila ada, 404 bila tidak ditemukan', async () => {
    const existing = {
      id: 5,
      employeeCode: 'EMP100',
      fullName: 'Andi',
      email: 'andi@absenkan.local',
      phone: '0812',
      department: 'IT',
      position: 'Dev',
      joinDate: null,
      role: UserRole.EMPLOYEE,
      isActive: true,
    };
    const { service, audit } = makeService(existing);
    const res = await service.update(admin, 5, { position: 'Senior Dev' } as any);
    expect(res.position).toBe('Senior Dev');
    // audit UPDATE tercatat
    const logs = audit.log.mock.calls;
    expect(logs.some((c: any[]) => c[1] === 'UPDATE')).toBe(true);
  });

  it('findDepartments mengembalikan daftar departemen unik (tanpa null/kosong)', async () => {
    const repo: any = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { department: 'IT' },
          { department: 'HRD' },
          { department: null },
          { department: '' },
        ]),
      }),
    };
    const audit = { log: jest.fn() };
    const service = new EmployeesService(repo as any, audit as any);
    await expect(service.findDepartments()).resolves.toEqual(['IT', 'HRD']);
  });
});
