import {
  IsArray,
  IsString,
  ValidateNested,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WeeklyScheduleDto {
  @ApiProperty({
    description: '요일 (예: MONDAY, TUESDAY 등)',
    example: 'MONDAY',
  })
  @IsString()
  day_of_week: string;

  @ApiProperty({
    description: '시작 시간 (HH:mm 형식)',
    example: '09:00',
  })
  @IsString()
  start_time: string;

  @ApiProperty({
    description: '종료 시간 (HH:mm 형식)',
    example: '18:00',
  })
  @IsString()
  end_time: string;
}

export class ExceptionDateDto {
  @ApiProperty({
    description: '예외 날짜 (YYYY-MM-DD 형식)',
    example: '2024-04-08',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: '시작 시간 (HH:mm 형식)',
    example: '09:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiProperty({
    description: '종료 시간 (HH:mm 형식)',
    example: '18:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiProperty({
    description: '예외 사유',
    example: '공휴일',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ManageAvailableTimeDto {
  @ApiProperty({
    description: '주간 스케줄',
    type: [WeeklyScheduleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyScheduleDto)
  weekly_schedule: WeeklyScheduleDto[];

  @ApiProperty({
    description: '예외 날짜 목록',
    type: [ExceptionDateDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExceptionDateDto)
  exception_dates?: ExceptionDateDto[];
}
