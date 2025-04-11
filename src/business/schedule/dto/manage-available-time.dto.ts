import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BreakTimeDto {
  @ApiProperty({
    description: '휴식 시간 시작 (HH:MM 형식)',
    example: '12:00',
  })
  @IsString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({
    description: '휴식 시간 종료 (HH:MM 형식)',
    example: '13:00',
  })
  @IsString()
  @IsNotEmpty()
  end: string;
}

export class ScheduleDto {
  @ApiProperty({
    description: '영업일 선택 (일~토요일 순서로 7개의 boolean 값)',
    example: [false, true, true, true, true, true, false],
    type: [Boolean],
  })
  @IsArray()
  @IsBoolean({ each: true })
  selectedDays: boolean[];

  @ApiProperty({
    description: '영업 시작 시간 (HH:MM 형식)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: '영업 종료 시간 (HH:MM 형식)',
    example: '18:00',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: '휴식 시간 (점심 시간 등 영업 중 휴식)',
    required: false,
    type: BreakTimeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakTimeDto)
  breakTime?: BreakTimeDto;
}

export class ManageAvailableTimeDto {
  @ApiProperty({
    description: '기본 영업 일정 (요일별 영업 시간)',
    type: ScheduleDto,
  })
  @ValidateNested()
  @Type(() => ScheduleDto)
  schedule: ScheduleDto;
}
