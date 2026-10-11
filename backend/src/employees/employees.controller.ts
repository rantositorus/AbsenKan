import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ResetPasswordDto } from '../auth/dto/reset-password.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../entities/employee.entity';
import { AuthUser } from '../auth/auth-user.interface';
import { IsBoolean, IsOptional } from 'class-validator';

class SetActiveDto {
  @IsBoolean()
  isActive: boolean;
}

@Controller('employees')
@Roles(UserRole.HR_ADMIN)
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post()
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateEmployeeDto) {
    return this.employees.create(actor, dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('status') status?: string,
  ) {
    return this.employees.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      department,
      status,
    });
  }

  @Get('departments')
  findDepartments() {
    return this.employees.findDepartments();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employees.findOne(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employees.update(actor, id, dto);
  }

  @Patch(':id/active')
  setActive(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetActiveDto,
  ) {
    return this.employees.setActive(actor, id, dto.isActive);
  }

  @Post(':id/reset-password')
  resetPassword(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.employees.resetPassword(actor, id, dto.newPassword);
  }
}
