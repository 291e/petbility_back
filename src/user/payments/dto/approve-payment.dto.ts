import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

/**
 * 결제 승인 DTO
 */
export class ApprovePaymentDto {
  /**
   * 결제 키
   * @example 'tosspayments_20230101_1234567890abcdef1234567890'
   */
  @ApiProperty({
    description: '토스페이먼츠 결제 키',
    example: 'tosspayments_20230101_1234567890abcdef1234567890',
  })
  @IsNotEmpty()
  @IsString()
  paymentKey: string;

  /**
   * 주문 ID
   * @example 'order_1234567890'
   */
  @ApiProperty({
    description: '주문 ID',
    example: 'order_1234567890',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  /**
   * 결제 금액
   * @example 50000
   */
  @ApiProperty({
    description: '결제 금액',
    example: 50000,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
