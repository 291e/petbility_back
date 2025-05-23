import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  Length,
  Matches,
  IsUrl,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PetGender } from './create-pet.dto';

export class UpdatePetDto {
  @ApiProperty({ description: '반려동물 이름', example: '멍멍이' })
  @IsOptional()
  @IsString()
  @Length(1, 30, { message: '이름은 1~30자 사이여야 합니다.' })
  name?: string;

  @ApiProperty({ description: '반려동물 종류', example: '강아지' })
  @IsOptional()
  @IsString()
  @Length(1, 30, { message: '종류는 1~30자 사이여야 합니다.' })
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '종은 한글과 영문만 입력 가능합니다.',
  })
  species?: string;

  @ApiProperty({ description: '반려동물 품종', example: '말티즈' })
  @IsOptional()
  @IsString()
  @Length(1, 30, { message: '품종은 1~30자 사이여야 합니다.' })
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '품종은 한글과 영문만 입력 가능합니다.',
  })
  breed?: string;

  @ApiProperty({ description: '반려동물 생년월일', example: '2020-01-01' })
  @IsOptional()
  @IsDateString({}, { message: '유효한 날짜 형식이 아닙니다. (YYYY-MM-DD)' })
  birthDate?: string;

  @ApiProperty({
    description: '반려동물 성별',
    enum: PetGender,
    example: PetGender.MALE,
  })
  @IsOptional()
  @IsEnum(PetGender, { message: '유효한 성별 값이 아닙니다.' })
  gender?: PetGender;

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
  @IsUrl({}, { message: '유효한 URL 형식이 아닙니다.' })
  profileImageUrl?: string;

  @ApiProperty({
    description: '반려동물 특이사항',
    example: '알러지가 있음',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '특이사항은 500자 이내로 입력해야 합니다.' })
  note?: string;
}
