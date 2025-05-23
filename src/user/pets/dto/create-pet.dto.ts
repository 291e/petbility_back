import {
  IsString,
  IsOptional,
  IsEnum,
  Length,
  Matches,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PetGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export class CreatePetDto {
  @ApiProperty({ description: '반려동물 이름', example: '멍멍이' })
  @IsString()
  @Length(1, 30, { message: '이름은 1~30자 사이여야 합니다.' })
  name: string;

  @ApiProperty({ description: '반려동물 종류', example: '강아지' })
  @IsString()
  @Length(1, 30, { message: '종류는 1~30자 사이여야 합니다.' })
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '종은 한글과 영문만 입력 가능합니다.',
  })
  species: string;

  @ApiProperty({ description: '반려동물 품종', example: '말티즈' })
  @IsString()
  @Length(1, 30, { message: '품종은 1~30자 사이여야 합니다.' })
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '품종은 한글과 영문만 입력 가능합니다.',
  })
  breed: string;

  @ApiProperty({
    description: '반려동물 나이',
    example: 3,
    minimum: 0,
    maximum: 30,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '나이는 숫자로 입력해야 합니다.' })
  @Min(0, { message: '나이는 0세 이상이어야 합니다.' })
  @Max(30, { message: '나이는 30세 이하여야 합니다.' })
  age?: number;

  @ApiProperty({
    description: '반려동물 무게 (kg)',
    example: 5.5,
    minimum: 0.1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '무게는 숫자로 입력해야 합니다.' })
  @Min(0.1, { message: '무게는 0.1kg 이상이어야 합니다.' })
  @Max(100, { message: '무게는 100kg 이하여야 합니다.' })
  weight?: number;

  @ApiProperty({
    description: '반려동물 프로필 이미지 URL',
    example: 'https://example.com/images/pet.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;
}
