// src/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'USER',
  BUSINESS = 'BUSINESS',
}

export class CreateUserDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  name: string;

  @ApiProperty({ example: '01012345678', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/)
  phone?: string;

  @ApiProperty({ example: 'profile.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: '서울시 강남구', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 37.5665, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ example: 126.978, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
