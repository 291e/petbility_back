// src/services/dto/create-service.dto.ts

import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ServiceCategory } from '@prisma/client'; // enum을 Prisma에서 직접 불러올 수도 있음

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  price: number;

  @IsEnum(ServiceCategory)
  category: ServiceCategory;
}
