import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PetGender } from './create-pet.dto';

export class UpdatePetDto {
  @ApiProperty({ description: '반려동물 이름', example: '멍멍이' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  name?: string;

  @ApiProperty({ description: '반려동물 종류', example: '강아지' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '종은 한글과 영문만 입력 가능합니다.',
  })
  species?: string;

  @ApiProperty({ description: '반려동물 품종', example: '말티즈' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '품종은 한글과 영문만 입력 가능합니다.',
  })
  breed?: string;

  @ApiProperty({ description: '반려동물 생년월일', example: '2020-01-01' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({
    description: '반려동물 성별',
    enum: PetGender,
    example: PetGender.MALE,
  })
  @IsOptional()
  @IsEnum(PetGender)
  gender?: PetGender;

  @ApiProperty({ description: '반려동물 특이사항', example: '알러지가 있음' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
