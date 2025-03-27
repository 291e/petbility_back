import {
  IsUUID,
  IsDateString,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class CreateReservationDto {
  @IsUUID()
  service_id: string;

  @IsUUID()
  pet_id: string;

  @IsDateString()
  date: string; // YYYY-MM-DD 형식

  @IsString()
  time: string; // '14:00' 등 시간 문자열

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus; // 기본값은 서버에서 PENDING 처리
}
