import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../entities/employee.entity';

export const ROLES_KEY = 'roles';
/** Batasi akses hanya untuk peran tertentu. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
