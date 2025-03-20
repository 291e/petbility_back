import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  // 반려동물 등록
  async createPet(userId: string, data: Prisma.PetCreateInput) {
    return this.prisma.pet.create({
      data: {
        ...data,
        user: { connect: { user_id: userId } },
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

  // 반려동물 수정
  async updatePet(petId: string, data: Prisma.PetUpdateInput) {
    return this.prisma.pet.update({
      where: { pet_id: petId },
      data,
    });
  }

  // 반려동물 삭제
  async deletePet(petId: string) {
    return this.prisma.pet.delete({ where: { pet_id: petId } });
  }
}
