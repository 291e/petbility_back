// src/services/dto/create-service.dto.ts

import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ServiceCategory } from '@prisma/client'; // enum을 Prisma에서 직접 불러올 수도 있음
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: '서비스 이름',
    example: '강아지 목욕',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '서비스 설명',
    example: '반려견 목욕 서비스입니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '서비스 가격',
    example: 30000,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: '서비스 카테고리',
    enum: ServiceCategory,
    example: 'grooming',
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;
}
