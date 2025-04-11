// src/reservations/dto/update-reservation.dto.ts
// 예약 수정을 위한 DTO 클래스
// start_time과 end_time 필드를 사용하여 예약 시간을 수정할 수 있습니다.

import {
  IsUUID,
  IsDateString,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ReservationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReservationDto {
  @ApiProperty({
    description: '예약 시작 시간 (ISO 형식)',
    example: '2024-04-08T14:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiProperty({
    description: '예약 종료 시간 (ISO 형식)',
    example: '2024-04-08T15:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({
    description: '예약 메모',
    example: '강아지가 긴장을 잘 합니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
