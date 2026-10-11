import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../entities/employee.entity';
import { Attendance } from '../entities/attendance.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Setting } from '../entities/setting.entity';
import { Notification } from '../entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USER', 'absenkan'),
        password: config.get<string>('DB_PASSWORD', 'absenkan'),
        database: config.get<string>('DB_NAME', 'absenkan'),
        entities: [Employee, Attendance, AuditLog, Setting, Notification],
        // MVP: sync otomatis skema. Ganti ke migrations di produksi.
        synchronize: true,
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
