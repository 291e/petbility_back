import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
} from 'class-validator';

/**
 * 예약 생성 DTO
 */
export class CreateReservationDto {
  /**
   * 결제 ID
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: '결제 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  payment_id: string;

  /**
   * 서비스 ID
   * @example 'fbd3bf29-5469-4cfe-b26c-52b5b671f8ca'
   */
  @ApiProperty({
    description: '서비스 ID',
    example: 'fbd3bf29-5469-4cfe-b26c-52b5b671f8ca',
  })
  @IsNotEmpty()
  @IsUUID()
  service_id: string;

  /**
   * 비즈니스 ID
   * @example '521de683-0def-46ae-9323-d6adc2538f4a'
   */
  @ApiProperty({
    description: '비즈니스 ID',
    example: '521de683-0def-46ae-9323-d6adc2538f4a',
  })
  @IsNotEmpty()
  @IsUUID()
  business_id: string;

  /**
   * 반려동물 ID
   * @example 'a68d7a5f-55a3-4cab-8e1c-46c4b931a12e'
   */
  @ApiProperty({
    description: '반려동물 ID',
    example: 'a68d7a5f-55a3-4cab-8e1c-46c4b931a12e',
  })
  @IsNotEmpty()
  @IsUUID()
  pet_id: string;

  /**
   * 예약 시작 시간
   * @example '2023-12-31T15:00:00Z'
   */
  @ApiProperty({
    description: '예약 시작 시간',
    example: '2023-12-31T15:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  start_time: string;

  /**
   * 예약 메모 (선택 사항)
   * @example '알러지가 있으니 주의해주세요'
   */
  @ApiProperty({
    description: '예약 메모 (선택 사항)',
    example: '알러지가 있으니 주의해주세요',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
