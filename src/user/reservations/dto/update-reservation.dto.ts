// src/reservations/dto/update-reservation.dto.ts
import {
  IsUUID,
  IsDateString,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ReservationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReservationDto {
  @ApiProperty({
    description: '예약 날짜 및 시간 (ISO 형식)',
    example: '2024-04-08T14:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  reserved_at?: string;

  @ApiProperty({
    description: '예약 메모',
    example: '강아지가 긴장을 잘 합니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
