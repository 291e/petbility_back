import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateAvailableTimeDto {
  @IsString()
  business_id: string;

  @IsString()
  day_of_week: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsBoolean()
  @IsOptional()
  is_exception?: boolean;
}
