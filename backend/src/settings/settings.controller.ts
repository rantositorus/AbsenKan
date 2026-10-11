import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { SettingsService } from './settings.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/employee.entity';

class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  value: string;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getAll() {
    return this.settings.getAll();
  }

  @Roles(UserRole.HR_ADMIN)
  @Put(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settings.set(key, dto.value);
  }
}
