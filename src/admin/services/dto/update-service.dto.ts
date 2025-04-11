// src/services/dto/update-service.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiProperty({
    description: '서비스 이름',
    example: '프리미엄 강아지 목욕',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: '서비스 설명',
    example: '프리미엄 반려견 목욕 서비스입니다.',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: '서비스 가격',
    example: 35000,
    required: false,
  })
  price?: number;

  @ApiProperty({
    description: '서비스 카테고리',
    enum: ServiceCategory,
    example: 'grooming',
    required: false,
  })
  category?: ServiceCategory;
}
