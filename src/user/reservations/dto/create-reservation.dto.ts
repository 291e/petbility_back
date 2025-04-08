// src/reservations/dto/create-reservation.dto.ts

import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    description: '서비스 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  service_id: string;

  @ApiProperty({
    description: '반려동물 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  pet_id: string;

  @ApiProperty({
    description: '예약 날짜 및 시간 (ISO 형식)',
    example: '2024-04-08T14:00:00Z',
  })
  @IsDateString()
  reserved_at: string; // ISO 형식으로 날짜+시간

  @ApiProperty({
    description: '예약 메모',
    example: '강아지가 긴장을 잘 합니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
