import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signUp(@Body() userData: CreateUserDto) {
    return this.usersService.signUp(userData);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.usersService.getUserById(req.user.user_id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch('me')
  async updateMe(@Request() req, @Body() updateData: UpdateUserDto) {
    return this.usersService.updateUser(req.user.user_id, updateData);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('me')
  async deleteMe(@Request() req) {
    return this.usersService.deleteUser(req.user.user_id);
  }
}
