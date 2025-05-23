import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async signUp(userData: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          image: userData.image,
          address: userData.address,
          role: userData.role,
          latitude: userData.latitude,
          longitude: userData.longitude,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('이미 존재하는 이메일입니다.');
        }
      }
      throw error;
    }
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: { email: updateUserDto.email },
        });

        if (existingUser) {
          throw new BadRequestException('이미 사용 중인 이메일입니다.');
        }
      }

      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        include: {
          pets: true,
          services: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('이미 존재하는 이메일입니다.');
        }
      }
      throw error;
    }
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.role === UserRole.BUSINESS) {
      throw new ForbiddenException('사업자 계정은 삭제할 수 없습니다.');
    }

    await this.prisma.$transaction([
      this.prisma.reservation.deleteMany({
        where: { user_id: id },
      }),
      this.prisma.pet.deleteMany({
        where: { user_id: id },
      }),
      this.prisma.user.delete({
        where: { id },
      }),
    ]);

    return { message: '사용자가 성공적으로 삭제되었습니다.' };
  }

  async upgradeToBusiness(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.role === UserRole.BUSINESS) {
      throw new BadRequestException('이미 사업자 계정입니다.');
    }

    return await this.prisma.user.update({
      where: { id },
      data: { role: UserRole.BUSINESS },
      include: {
        pets: true,
        services: true,
      },
    });
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

  async findAll(filter: any = {}) {
    const users = await this.prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        address: true,
        role: true,
        createdAt: true,
        latitude: true,
        longitude: true,
      },
    });

    return users;
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }

      const newUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          phone: createUserDto.phone || '',
          image: createUserDto.image || '',
          address: createUserDto.address || '',
          role: createUserDto.role,
        },
      });

      return newUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('사용자 생성 중 오류가 발생했습니다.');
      }
      throw error;
    }
  }

  async findByIdWithFilters(id: string, filter: Record<string, any> = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        ...filter,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async updateProfile(id: string, updateData: any) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateData,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          '사용자 프로필 업데이트 중 오류가 발생했습니다.',
        );
      }
      throw error;
    }
  }

  async upgradeUserToBusiness(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.role === UserRole.BUSINESS) {
      throw new BadRequestException('이미 사업자 계정입니다.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        role: UserRole.BUSINESS,
      },
      include: {
        pets: true,
        services: true,
      },
    });

    return updatedUser;
  }
}
