import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 결제 취소 DTO
 */
export class CancelPaymentDto {
  /**
   * 취소 사유
   * @example '고객 요청으로 인한 취소'
   */
  @ApiProperty({
    description: '취소 사유',
    example: '고객 요청으로 인한 취소',
  })
  @IsNotEmpty()
  @IsString()
  cancel_reason: string;
}
