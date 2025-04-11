// src/reservations/dto/create-reservation.dto.ts
// 예약 생성을 위한 DTO 클래스
// start_time과 end_time 필드를 사용하여 예약 시간을 지정합니다.

import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    description: '서비스 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  service_id?: string;

  @ApiProperty({
    description: '반려동물 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  pet_id?: string;

  @ApiProperty({
    description: '예약 시작 시간 (ISO 형식)',
    example: '2024-04-08T14:00:00Z',
  })
  @IsDateString()
  start_time: string; // ISO 형식으로 날짜+시간

  @ApiProperty({
    description: '예약 종료 시간 (ISO 형식)',
    example: '2024-04-08T15:00:00Z',
  })
  @IsDateString()
  end_time: string; // ISO 형식으로 날짜+시간

  @ApiProperty({
    description:
      '예약 가능 여부 (사업자가 차단한 시간인지 여부, true: 예약 가능, false: 예약 불가)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean = true;

  @ApiProperty({
    description: '예약 메모',
    example: '강아지가 긴장을 잘 합니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
