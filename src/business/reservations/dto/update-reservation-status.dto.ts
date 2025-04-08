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
