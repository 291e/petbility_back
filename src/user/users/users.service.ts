import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SupabaseService } from '@/auth/supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async signUp(userData: any) {
    return this.prisma.user.create({
      data: {
        user_id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || '',
        profileImage: userData.profileImage || '',
        address: userData.address || '',
        role: userData.role,
      },
    });
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
    });
  }

  async updateUser(userId: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.prisma.user.update({
      where: { user_id: userId },
      data: {
        ...updateDto,
      },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { user_id: userId },
    });
  }

  async upgradeToBusiness(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.role === 'BUSINESS') {
      throw new BadRequestException('이미 사업자 계정입니다.');
    }

    return this.prisma.user.update({
      where: { user_id: userId },
      data: {
        role: 'BUSINESS',
      },
    });
  }
}
