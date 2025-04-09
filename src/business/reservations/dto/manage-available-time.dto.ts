import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WeeklyScheduleDto {
  @ApiProperty({ description: '요일', example: 'MONDAY' })
  @IsString()
  @IsNotEmpty()
  day_of_week: string;

  @ApiProperty({ description: '시작 시간', example: '09:00' })
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({ description: '종료 시간', example: '18:00' })
  @IsString()
  @IsNotEmpty()
  end_time: string;
}

export class ExceptionDateDto {
  @ApiProperty({ description: '요일', example: 'MONDAY' })
  @IsString()
  @IsNotEmpty()
  day_of_week: string;

  @ApiProperty({ description: '시작 시간', example: '12:00' })
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({ description: '종료 시간', example: '13:00' })
  @IsString()
  @IsNotEmpty()
  end_time: string;

  @ApiProperty({ description: '휴식 시간 사유', example: '휴식 시간' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ManageAvailableTimeDto {
  @ApiProperty({ description: '주간 일정', type: [WeeklyScheduleDto] })
  @IsArray()
  @ValidateNested({ each: true }) // ✅ 추가
  @Type(() => WeeklyScheduleDto) // ✅ 추가
  @IsNotEmpty()
  weekly_schedule: WeeklyScheduleDto[];

  @ApiProperty({
    description: '예외 일정',
    type: [ExceptionDateDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true }) // ✅ 추가
  @Type(() => ExceptionDateDto) // ✅ 추가
  @IsOptional()
  exception_dates?: ExceptionDateDto[];
}
