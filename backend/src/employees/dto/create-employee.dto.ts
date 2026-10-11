import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../entities/employee.entity';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  employeeCode: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^[0-9+\-\s()]*$/, { message: 'Nomor telepon tidak valid' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsISO8601()
  joinDate?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
