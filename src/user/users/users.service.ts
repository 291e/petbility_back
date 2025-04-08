import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SupabaseService } from '@/auth/supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async signUp(userData: CreateUserDto) {
    try {
      // 이미 존재하는 사용자인지 확인
      const existingUser = await this.prisma.user.findUnique({
        where: { user_id: userData.user_id },
      });

      if (existingUser) {
        throw new BadRequestException('이미 존재하는 사용자입니다.');
      }

      return await this.prisma.user.create({
        data: {
          user_id: userData.user_id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone || null,
          profileImage: userData.profile_image || null,
          address: userData.address || null,
          role: userData.role,
          latitude: userData.latitude || null,
          longitude: userData.longitude || null,
        },
        include: {
          pets: true,
          services: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('이미 사용 중인 이메일입니다.');
        }
      }
      throw error;
    }
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        pets: true,
        services: true,
        reservations: {
          include: {
            service: true,
            pet: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async updateUser(userId: string, updateDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      // 이메일 변경 시 중복 체크
      if (updateDto.email && updateDto.email !== user.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            email: updateDto.email,
            user_id: { not: userId },
          },
        });
        if (existingUser) {
          throw new BadRequestException('이미 사용 중인 이메일입니다.');
        }
      }

      return await this.prisma.user.update({
        where: { user_id: userId },
        data: {
          email: updateDto.email,
          name: updateDto.name,
          phone: updateDto.phone,
          profileImage: updateDto.profile_image,
          address: updateDto.address,
          latitude: updateDto.latitude,
          longitude: updateDto.longitude,
        },
        include: {
          pets: true,
          services: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('이미 사용 중인 이메일입니다.');
        }
      }
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
        include: {
          pets: true,
          services: true,
          reservations: true,
        },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      // 사업자 계정인 경우 삭제 불가
      if (user.role === UserRole.BUSINESS) {
        throw new ForbiddenException('사업자 계정은 삭제할 수 없습니다.');
      }

      // 관련 데이터 삭제
      await this.prisma.$transaction([
        this.prisma.reservation.deleteMany({
          where: { user_id: userId },
        }),
        this.prisma.pet.deleteMany({
          where: { user_id: userId },
        }),
        this.prisma.user.delete({
          where: { user_id: userId },
        }),
      ]);

      return { message: '사용자가 성공적으로 삭제되었습니다.' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('사용자 삭제 중 오류가 발생했습니다.');
      }
      throw error;
    }
  }

  async upgradeToBusiness(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      if (user.role === UserRole.BUSINESS) {
        throw new BadRequestException('이미 사업자 계정입니다.');
      }

      return await this.prisma.user.update({
        where: { user_id: userId },
        data: {
          role: UserRole.BUSINESS,
        },
        include: {
          pets: true,
          services: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          '사업자 계정으로 업그레이드 중 오류가 발생했습니다.',
        );
      }
      throw error;
    }
  }

  async searchUsers(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        skip,
        take: limit,
        include: {
          pets: true,
          services: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
      }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
