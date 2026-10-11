import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../entities/employee.entity';
import { Attendance } from '../entities/attendance.entity';
import { RemindersService } from './reminders.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Attendance]), NotificationsModule],
  providers: [RemindersService],
})
export class RemindersModule {}
