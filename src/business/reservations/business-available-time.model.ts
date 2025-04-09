import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsOptional } from 'class-validator';

export class BusinessAvailableTime {
  @ApiProperty({ description: '비즈니스 ID' })
  @IsString()
  business_id: string;

  @ApiProperty({ description: '요일 (0-6, 0은 일요일)' })
  @IsString()
  day_of_week: string;

  @ApiProperty({ description: '시작 시간 (HH:mm 형식)' })
  @IsString()
  start_time: string;

  @ApiProperty({ description: '종료 시간 (HH:mm 형식)' })
  @IsString()
  end_time: string;

  @ApiProperty({ description: '예외 날짜 (YYYY-MM-DD 형식)', required: false })
  @IsOptional()
  @IsDate()
  exception_date?: Date;

  @ApiProperty({ description: '생성일' })
  @IsDate()
  created_at: Date;

  @ApiProperty({ description: '수정일' })
  @IsDate()
  updated_at: Date;
}
