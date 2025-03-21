import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('admin/users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @Roles('ADMIN')
  async getAllUsers() {
    return this.adminUsersService.getAllUsers();
  }

  @Get(':id')
  @Roles('ADMIN')
  async getUserDetail(@Param('id') userId: string) {
    return this.adminUsersService.getUserById(userId);
  }
}
