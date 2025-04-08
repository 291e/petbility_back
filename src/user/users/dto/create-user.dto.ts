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
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  user_id: string;

  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '이름 (2-30자의 한글 또는 영문)',
    example: '홍길동',
  })
  @IsString()
  @Matches(/^[가-힣a-zA-Z\s]{2,30}$/, {
    message: '이름은 2-30자의 한글 또는 영문만 가능합니다.',
  })
  name: string;

  @ApiProperty({
    description: '전화번호 (10-11자리의 숫자)',
    example: '01012345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, {
    message: '전화번호는 10-11자리의 숫자만 가능합니다.',
  })
  phone?: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profile_image?: string;

  @ApiProperty({
    description: '주소',
    example: '서울시 강남구 테헤란로 123',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: '위도',
    example: 37.5665,
    required: false,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({
    description: '경도',
    example: 126.978,
    required: false,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
