import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signUp(
    @Body()
    userData: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      profileImage?: string;
      address?: string;
      role: string;
    },
  ) {
    return this.usersService.signUp(userData);
  }
}
