// src/business/reservations/dto/update-reservation-status.dto.ts
// 예약 상태 업데이트를 위한 DTO 클래스
// 상태는 CONFIRMED, REJECTED, COMPLETED, NO_SHOW 등으로 변경 가능합니다.

import { IsEnum } from 'class-validator';
import { ReservationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReservationStatusDto {
  @ApiProperty({
    enum: ReservationStatus,
    description: '예약 상태',
    example: 'CONFIRMED',
  })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
