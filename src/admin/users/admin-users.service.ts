import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers(params: { role?: string; page: number; limit: number }) {
    const { role, page, limit } = params;
    const where = role ? { role: role.toUpperCase() } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      total,
      page,
      limit,
      users,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        reservations: {
          include: {
            service: true,
            pet: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    return user;
  }

  // ✅ 유저 삭제 (소프트 또는 하드 삭제)
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        services: true,
        reservations: true,
      },
    });

    if (!user) throw new NotFoundException('해당 유저가 존재하지 않습니다.');

    // 👉 하드 삭제 (원하면 soft delete로 수정 가능)
    return this.prisma.user.delete({ where: { id: userId } });
  }

  // ✅ 유저 역할 변경
  async updateUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
