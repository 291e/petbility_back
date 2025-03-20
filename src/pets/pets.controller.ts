import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  // 반려동물 등록
  @UseGuards(JwtAuthGuard)
  @Post()
  async createPet(@Request() req, @Body() petData) {
    const userId = req.user.user_id; // JWT 토큰에서 유저 ID 추출
    return this.petsService.createPet(userId, petData);
  }

  // 특정 유저의 반려동물 목록 조회
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserPets(@Request() req) {
    const userId = req.user.user_id;
    return this.petsService.getUserPets(userId);
  }

  // 특정 반려동물 조회
  @Get(':id')
  async getPetById(@Param('id') petId: string) {
    return this.petsService.getPetById(petId);
  }

  // 반려동물 정보 수정
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePet(@Param('id') petId: string, @Body() petData) {
    return this.petsService.updatePet(petId, petData);
  }

  // 반려동물 삭제
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePet(@Param('id') petId: string) {
    return this.petsService.deletePet(petId);
  }
}
