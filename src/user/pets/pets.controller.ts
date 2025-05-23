import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { AuthGuard } from '@/auth/auth.guard';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Request } from 'express';

@ApiTags('반려동물')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @ApiOperation({ summary: '반려동물 등록' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '반려동물이 성공적으로 등록되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청입니다.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post()
  async createPet(@Req() req: Request, @Body() petData: CreatePetDto) {
    return this.petsService.createPet(req.user.id, petData);
  }

  @ApiOperation({ summary: '사용자의 반려동물 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반려동물 목록을 성공적으로 조회했습니다.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  async getUserPets(@Req() req: Request) {
    return this.petsService.getUserPets(req.user.id);
  }

  @ApiOperation({ summary: '반려동물 상세 정보 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반려동물 정보를 성공적으로 조회했습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '반려동물을 찾을 수 없습니다.',
  })
  @ApiParam({ name: 'id', description: '반려동물 ID' })
  @Get(':id')
  async getPetById(@Param('id') petId: string) {
    return this.petsService.getPetById(petId);
  }

  @ApiOperation({ summary: '반려동물 정보 수정' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반려동물 정보가 성공적으로 수정되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '반려동물을 찾을 수 없거나 수정 권한이 없습니다.',
  })
  @ApiParam({ name: 'id', description: '반려동물 ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  async updatePet(
    @Req() req: Request,
    @Param('id') petId: string,
    @Body() petData: UpdatePetDto,
  ) {
    return this.petsService.updatePet(petId, petData, req.user.id);
  }

  @ApiOperation({ summary: '반려동물 삭제' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반려동물이 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '반려동물을 찾을 수 없거나 삭제 권한이 없습니다.',
  })
  @ApiParam({ name: 'id', description: '반려동물 ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deletePet(@Req() req: Request, @Param('id') petId: string) {
    return this.petsService.deletePet(petId, req.user.id);
  }
}
