// src/reservations/dto/create-reservation.dto.ts

import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  service_id: string;

  @IsUUID()
  pet_id: string;

  @IsDateString()
  reserved_at: string; // ISO 형식으로 날짜+시간

  @IsOptional()
  @IsString()
  notes?: string;
}
