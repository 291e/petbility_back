import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  async findAllUsers(
    @Query('role') role?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usersService.findAllUsers({
      role,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    return this.usersService.findUserById(userId);
  }

  // ✅ 유저 삭제
  @Delete(':id')
  async deleteUser(@Param('id') userId: string) {
    return this.usersService.deleteUser(userId);
  }

  // ✅ 유저 역할 변경
  @Patch(':id/role')
  async updateRole(@Param('id') userId: string, @Body('role') role: string) {
    if (!['USER', 'BUSINESS', 'ADMIN'].includes(role.toUpperCase())) {
      throw new BadRequestException('유효하지 않은 역할입니다.');
    }
    return this.usersService.updateUserRole(userId, role.toUpperCase());
  }
}
