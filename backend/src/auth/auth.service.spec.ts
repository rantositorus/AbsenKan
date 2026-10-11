import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '../entities/employee.entity';

function makeService(employee: any = null) {
  const employees: any = {
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(employee),
    }),
    findOneBy: jest.fn().mockResolvedValue(employee),
    save: jest.fn((x) => x),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };
  const config = { get: jest.fn() };
  const throttle = {
    isLocked: jest.fn().mockReturnValue({ locked: false }),
    recordFailure: jest.fn().mockReturnValue({ locked: false }),
    clear: jest.fn(),
  };
  const service = new AuthService(employees as any, jwt as any, config as any, throttle as any);
  return { service, employees, jwt, throttle };
}

const activeEmployee = {
  id: 1,
  employeeCode: 'EMP001',
  fullName: 'Budi',
  email: 'budi@absenkan.local',
  role: UserRole.EMPLOYEE,
  isActive: true,
  passwordHash: '$2b$10$abcdefghijklmnopqrstuv', // dummy
};

describe('AuthService', () => {
  it('login gagal saat akun tidak ditemukan', async () => {
    const { service } = makeService(null);
    await expect(service.login('nobody', 'x')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login ditolak saat akun nonaktif', async () => {
    const { service } = makeService({ ...activeEmployee, isActive: false });
    await expect(service.login('EMP001', 'pass')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login berhasil mengembalikan user tanpa passwordHash', async () => {
    const { service } = makeService(activeEmployee);
    // override bcrypt.compare agar lolos
    const realBcrypt = jest.requireActual('bcryptjs');
    jest
      .spyOn(realBcrypt, 'compare')
      .mockResolvedValue(true);
    const result = await service.login('EMP001', 'Rahasia#123');
    expect(result.token).toBe('signed-token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user.employeeCode).toBe('EMP001');
    jest.restoreAllMocks();
  });
});
