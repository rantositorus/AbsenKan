import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  /** Bisa berupa employee code atau email. */
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  identifier: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
