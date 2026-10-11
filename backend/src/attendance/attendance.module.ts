import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../entities/attendance.entity';
import { Employee } from '../entities/employee.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Employee]),
    UploadsModule,
    SettingsModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
