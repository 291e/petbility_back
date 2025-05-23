import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  private readonly logger = new Logger(PetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 반려동물을 등록합니다.
   * @param userId 사용자 ID
   * @param data 반려동물 등록 데이터
   * @returns 등록된 반려동물 정보
   */
  async createPet(userId: string, data: CreatePetDto) {
    // 사용자 존재 여부 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    try {
      return await this.prisma.pet.create({
        data: {
          ...data,
          user: {
            connect: { id: userId },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`반려동물 등록 중 오류 발생: ${error.message}`);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('반려동물 등록에 실패했습니다.');
      }
      throw error;
    }
  }

  /**
   * 특정 유저의 반려동물 목록을 조회합니다.
   * @param userId 사용자 ID
   * @returns 반려동물 목록
   */
  async getUserPets(userId: string) {
    // 사용자 존재 여부 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.prisma.pet.findMany({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * 반려동물 상세 정보를 조회합니다.
   * @param petId 반려동물 ID
   * @returns 반려동물 상세 정보
   */
  async getPetById(petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { pet_id: petId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('반려동물을 찾을 수 없습니다.');
    }

    return pet;
  }

  /**
   * 반려동물 정보를 수정합니다. (본인만 가능)
   * @param petId 반려동물 ID
   * @param data 수정할 데이터
   * @param userId 현재 사용자 ID
   * @returns 수정된 반려동물 정보
   */
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`반려동물 수정 중 오류 발생: ${error.message}`);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('반려동물 정보 수정에 실패했습니다.');
      }
      throw error;
    }
  }

  /**
   * 반려동물을 삭제합니다. (본인만 가능)
   * @param petId 반려동물 ID
   * @param userId 현재 사용자 ID
   * @returns 삭제 결과 메시지
   */
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
      this.logger.error(`반려동물 삭제 중 오류 발생: ${error.message}`);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('반려동물 삭제에 실패했습니다.');
      }
      throw error;
    }
  }
}
