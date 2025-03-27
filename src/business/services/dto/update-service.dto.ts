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

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsJSON()
  available_time?: any;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;
}
