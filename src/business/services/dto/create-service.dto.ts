import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsJSON,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ServiceCategory } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  duration: number; // 분 단위

  @IsOptional()
  @IsJSON()
  available_time?: any; // JSON 구조: { mon: [...], tue: [...] }

  @IsString()
  location: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsEnum(ServiceCategory)
  category: ServiceCategory;
}
