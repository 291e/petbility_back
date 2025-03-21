import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePetDto } from './dto/create-pet.dto';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  // 반려동물 등록
  async createPet(userId: string, data: CreatePetDto) {
    return this.prisma.pet.create({
      data: {
        ...data,
        user: {
          connect: { user_id: userId },
        },
      },
    });
  }

  // 특정 유저의 반려동물 목록 조회
  async getUserPets(userId: string) {
    return this.prisma.pet.findMany({ where: { user_id: userId } });
  }

  // 반려동물 상세 조회
  async getPetById(petId: string) {
    return this.prisma.pet.findUnique({ where: { pet_id: petId } });
  }

  // 반려동물 수정 (본인만 가능)
  async updatePet(petId: string, data: Prisma.PetUpdateInput, userId: string) {
    return this.prisma.pet.updateMany({
      where: {
        pet_id: petId,
        user_id: userId,
      },
      data,
    });
  }

  // 반려동물 삭제 (본인만 가능)
  async deletePet(petId: string, userId: string) {
    return this.prisma.pet.deleteMany({
      where: {
        pet_id: petId,
        user_id: userId,
      },
    });
  }
}
