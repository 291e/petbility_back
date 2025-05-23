import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
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
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: '시간 형식이 올바르지 않습니다. HH:MM 형식으로 입력해주세요.',
  })
  start: string;

  @ApiProperty({
    description: '휴식 시간 종료 (HH:MM 형식)',
    example: '13:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: '시간 형식이 올바르지 않습니다. HH:MM 형식으로 입력해주세요.',
  })
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
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  selectedDays: boolean[];

  @ApiProperty({
    description: '영업 시작 시간 (HH:MM 형식)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: '시간 형식이 올바르지 않습니다. HH:MM 형식으로 입력해주세요.',
  })
  startTime: string;

  @ApiProperty({
    description: '영업 종료 시간 (HH:MM 형식)',
    example: '18:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: '시간 형식이 올바르지 않습니다. HH:MM 형식으로 입력해주세요.',
  })
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
