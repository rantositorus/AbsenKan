import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/employee.entity';

@Controller('audit-logs')
@Roles(UserRole.HR_ADMIN)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('targetTable') targetTable?: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.audit.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      action,
      targetTable,
      actorId: actorId ? parseInt(actorId, 10) : undefined,
    });
  }
}
