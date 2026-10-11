import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../entities/employee.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoginThrottleService } from './login-throttle.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change_me_in_production_please'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LoginThrottleService],
  exports: [JwtModule, LoginThrottleService],
})
export class AuthModule {}
