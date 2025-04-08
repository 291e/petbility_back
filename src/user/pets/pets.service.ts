import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  // 반려동물 등록
  async createPet(userId: string, data: CreatePetDto) {
    // 사용자 존재 여부 확인
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    try {
      return await this.prisma.pet.create({
        data: {
          ...data,
          user: {
            connect: { user_id: userId },
          },
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('반려동물 등록에 실패했습니다.');
      }
      throw error;
    }
  }

  // 특정 유저의 반려동물 목록 조회
  async getUserPets(userId: string) {
    // 사용자 존재 여부 확인
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.prisma.pet.findMany({
      where: { user_id: userId },
      include: {
        user: true,
      },
      orderBy: { pet_id: 'desc' },
    });
  }

  // 반려동물 상세 조회
  async getPetById(petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { pet_id: petId },
      include: {
        user: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('반려동물을 찾을 수 없습니다.');
    }

    return pet;
  }

  // 반려동물 수정 (본인만 가능)
  async updatePet(petId: string, data: UpdatePetDto, userId: string) {
    // 반려동물 존재 여부와 권한 확인
    const pet = await this.prisma.pet.findFirst({
      where: {
        pet_id: petId,
        user_id: userId,
      },
    });

    if (!pet) {
      throw new NotFoundException(
        '반려동물을 찾을 수 없거나 수정 권한이 없습니다.',
      );
    }

    try {
      return await this.prisma.pet.update({
        where: { pet_id: petId },
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('반려동물 정보 수정에 실패했습니다.');
      }
      throw error;
    }
  }

  // 반려동물 삭제 (본인만 가능)
  async deletePet(petId: string, userId: string) {
    // 반려동물 존재 여부와 권한 확인
    const pet = await this.prisma.pet.findFirst({
      where: {
        pet_id: petId,
        user_id: userId,
      },
    });

    if (!pet) {
      throw new NotFoundException(
        '반려동물을 찾을 수 없거나 삭제 권한이 없습니다.',
      );
    }

    try {
      // 트랜잭션으로 관련 데이터 삭제
      await this.prisma.$transaction([
        // 예약 정보 삭제
        this.prisma.reservation.deleteMany({
          where: { pet_id: petId },
        }),
        // 반려동물 삭제
        this.prisma.pet.delete({
          where: { pet_id: petId },
        }),
      ]);

      return { message: '반려동물이 성공적으로 삭제되었습니다.' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('반려동물 삭제에 실패했습니다.');
      }
      throw error;
    }
  }
}
