// src/business/reservations/dto/manage-available-time.dto.ts
// 가능 시간 관리를 위한 DTO 클래스
// 주간 일정과 예외 일정을 설정하기 위한 필드를 포함합니다.

import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WeeklyScheduleDto {
  @ApiProperty({
    description: '요일 (월,화,수,목,금,토,일)',
    example: 'MONDAY',
  })
  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @ApiProperty({
    description: '시작 시간 (HH:mm)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: '종료 시간 (HH:mm)',
    example: '18:00',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: '휴무일 여부',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isDayOff?: boolean;
}

export class BreakTimeDto {
  @ApiProperty({
    description: '요일 또는 특정 날짜 (YYYY-MM-DD)',
    example: 'MONDAY',
  })
  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @ApiProperty({
    description: '시작 시간 (HH:mm)',
    example: '12:00',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: '종료 시간 (HH:mm)',
    example: '13:00',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: '휴식 시간 사유',
    example: '점심 시간',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ScheduleDto {
  @ApiProperty({ description: '영업 시작 시간', example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: '영업 종료 시간', example: '18:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: '휴식 시간', type: BreakTimeDto })
  @IsObject()
  @ValidateNested()
  @Type(() => BreakTimeDto)
  breakTime: BreakTimeDto;

  @ApiProperty({
    description: '영업 요일 (일~토)',
    example: [true, true, true, true, true, true, false],
  })
  @IsArray()
  @IsBoolean({ each: true })
  selectedDays: boolean[];
}

export class ManageAvailableTimeDto {
  @ApiProperty({
    description: '주간 스케줄 목록',
    type: [WeeklyScheduleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyScheduleDto)
  weeklySchedules: WeeklyScheduleDto[];

  @ApiProperty({
    description: '휴식 시간 목록',
    type: [BreakTimeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakTimeDto)
  breakTimes: BreakTimeDto[];

  @ApiProperty({ description: '전체 스케줄 설정', type: ScheduleDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ScheduleDto)
  schedule: ScheduleDto;
}
