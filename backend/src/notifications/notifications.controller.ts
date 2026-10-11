import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/employee.entity';

class MarkReadDto {
  @IsOptional()
  @IsString()
  all?: string;
}

@Controller('notifications')
@Roles(UserRole.HR_ADMIN)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('audience') audience?: string,
    @Query('read') read?: string,
  ) {
    return this.notifications.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      audience,
      read,
    });
  }

  @Patch('read-all')
  markAllRead() {
    return this.notifications.markAllRead();
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number, @Body() _dto: MarkReadDto) {
    return this.notifications.markRead(id);
  }
}