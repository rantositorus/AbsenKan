import { UserRole } from '../entities/employee.entity';

/** Payload yang disimpan di dalam JWT. */
export interface JwtPayload {
  sub: number;
  code: string;
  role: UserRole;
  name: string;
}

/** Objek pengguna yang ditempel ke Request.user setelah autentikasi. */
export interface AuthUser extends JwtPayload {
  /** Versi sesi/izin. Cadangan untuk invalidasi token di masa depan. */
  v?: number;
}
