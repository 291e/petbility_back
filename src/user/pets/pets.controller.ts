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
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard'; // ← 이름 바꿔줌
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post()
  async createPet(@Request() req, @Body() petData: CreatePetDto) {
    const userId = req.user.user_id;
    return this.petsService.createPet(userId, petData);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get()
  async getUserPets(@Request() req) {
    const userId = req.user.user_id;
    return this.petsService.getUserPets(userId);
  }

  @Get(':id')
  async getPetById(@Param('id') petId: string) {
    return this.petsService.getPetById(petId);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  async updatePet(
    @Request() req,
    @Param('id') petId: string,
    @Body() petData: UpdatePetDto,
  ) {
    const userId = req.user.user_id;
    return this.petsService.updatePet(petId, petData, userId);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete(':id')
  async deletePet(@Request() req, @Param('id') petId: string) {
    const userId = req.user.user_id;
    return this.petsService.deletePet(petId, userId);
  }
}
