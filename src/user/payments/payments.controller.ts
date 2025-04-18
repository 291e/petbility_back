import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { Request } from 'express';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { ApprovePaymentDto } from './dto/approve-payment.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PaymentStatus } from '@prisma/client';

@ApiTags('결제')
@Controller('payments')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('request')
  @ApiOperation({
    summary: '결제 요청 생성',
    description: '새로운 결제 요청을 생성합니다.',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: '결제 요청이 성공적으로 생성되었습니다.',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'ORDER-12345678' },
        amount: { type: 'number', example: 50000 },
        orderName: { type: 'string', example: '펫 그루밍 서비스 예약' },
        ordererEmail: { type: 'string', example: 'user@example.com' },
        ordererName: { type: 'string', example: '홍길동' },
        successUrl: {
          type: 'string',
          example:
            'https://example.com/payments/success?orderId=ORDER-12345678',
        },
        failUrl: {
          type: 'string',
          example: 'https://example.com/payments/fail?orderId=ORDER-12345678',
        },
        serviceData: {
          type: 'object',
          properties: {
            service_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            business_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            pet_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            start_time: { type: 'string', example: '2023-08-15T14:00:00Z' },
            end_time: { type: 'string', example: '2023-08-15T15:00:00Z' },
            notes: { type: 'string', example: '특별 요청사항' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다.' })
  @ApiResponse({
    status: 404,
    description: '서비스 또는 비즈니스 정보를 찾을 수 없습니다.',
  })
  async createPaymentRequest(
    @Req() req: Request,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('사용자 ID를 찾을 수 없습니다.');
    }

    return this.paymentsService.createPaymentRequest(userId, createPaymentDto);
  }

  @Post('approve')
  @ApiOperation({
    summary: '결제 승인',
    description: '토스페이먼츠 결제를 승인합니다.',
  })
  @ApiBody({ type: ApprovePaymentDto })
  @ApiResponse({
    status: 200,
    description: '결제가 성공적으로 승인되었습니다.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            payment_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            paymentKey: {
              type: 'string',
              example: '5zJ4xY7m0kODnyRpQWGrN2xqGlNvLrKwv1M9ENjbeoPaZdL6',
            },
            orderId: { type: 'string', example: 'ORDER-12345678' },
            amount: { type: 'number', example: 50000 },
            method: { type: 'string', example: 'CARD' },
            status: { type: 'string', example: 'DONE' },
            receipt_url: {
              type: 'string',
              example: 'https://merchant.toss.im/receipt/12345',
            },
            reservation_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 404, description: '결제 정보를 찾을 수 없습니다.' })
  @ApiResponse({
    status: 500,
    description: '결제 승인 처리 중 오류가 발생했습니다.',
  })
  async approvePayment(
    @Body() approvePaymentDto: ApprovePaymentDto,
    @Req() req: Request,
  ) {
    try {
      const { paymentKey, orderId, amount } = approvePaymentDto;
      const userId = req.user.id;

      const result =
        await this.paymentsService.confirmPayment(approvePaymentDto);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '결제 승인 처리 중 오류가 발생했습니다.',
      );
    }
  }

  @Post('reservation')
  @ApiOperation({
    summary: '예약 생성',
    description: '결제 승인 후 예약 정보를 생성합니다.',
  })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({
    status: 201,
    description: '예약이 성공적으로 생성되었습니다.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            reservation_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            user_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            service_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            business_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            pet_id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            start_time: {
              type: 'string',
              example: '2023-12-31T15:00:00Z',
            },
            end_time: {
              type: 'string',
              example: '2023-12-31T16:00:00Z',
            },
            status: { type: 'string', example: 'CONFIRMED' },
            price: { type: 'number', example: 50000 },
            notes: { type: 'string', example: '알러지가 있으니 주의해주세요' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 404, description: '결제 정보를 찾을 수 없습니다.' })
  @ApiResponse({
    status: 500,
    description: '예약 생성 중 오류가 발생했습니다.',
  })
  async createReservation(
    @Body() createReservationDto: CreateReservationDto,
    @Req() req: Request,
  ) {
    try {
      const userId = req.user.id;
      const { payment_id } = createReservationDto;

      // 결제 정보 조회
      const payment = await this.paymentsService.getPaymentById(payment_id);

      if (!payment) {
        throw new NotFoundException('결제 정보를 찾을 수 없습니다.');
      }

      if (payment.user_id !== userId) {
        throw new BadRequestException('본인의 결제 정보만 예약할 수 있습니다.');
      }

      if (payment.status !== PaymentStatus.DONE) {
        throw new BadRequestException('결제가 완료되지 않았습니다.');
      }

      // 예약 정보 생성
      const reservation =
        await this.paymentsService.createReservationFromPayment(payment);

      return {
        success: true,
        data: reservation,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '예약 생성 중 오류가 발생했습니다.',
      );
    }
  }

  @Post(':paymentId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '결제 취소',
    description: '결제를 취소합니다.',
  })
  @ApiParam({
    name: 'paymentId',
    description: '결제 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: CancelPaymentDto })
  @ApiResponse({
    status: 200,
    description: '결제가 성공적으로 취소되었습니다.',
    schema: {
      type: 'object',
      properties: {
        payment_id: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        status: { type: 'string', example: 'CANCELED' },
        cancel_reason: { type: 'string', example: '고객 요청으로 취소' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
  })
  @ApiResponse({ status: 404, description: '결제 정보를 찾을 수 없습니다.' })
  async cancelPayment(
    @Param('paymentId') paymentId: string,
    @Body() cancelPaymentDto: CancelPaymentDto,
  ) {
    return this.paymentsService.cancelPayment(
      paymentId,
      cancelPaymentDto.cancel_reason,
    );
  }

  @Get(':payment_id/status')
  @ApiOperation({
    summary: '결제 상태 조회',
    description: '특정 결제의 현재 상태를 조회합니다.',
  })
  @ApiParam({ name: 'payment_id', description: '조회할 결제 ID' })
  @ApiResponse({
    status: 200,
    description: '결제 상태 정보를 반환합니다.',
    schema: {
      type: 'object',
      properties: {
        payment_id: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        status: { type: 'string', example: 'DONE' },
        amount: { type: 'number', example: 50000 },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '결제 정보를 찾을 수 없음' })
  async getPaymentStatus(@Param('payment_id') payment_id: string) {
    return this.paymentsService.getPaymentStatus(payment_id);
  }

  @Get('history')
  @ApiOperation({
    summary: '결제 내역 조회',
    description: '사용자의 결제 내역을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    description: '페이지 번호',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: '페이지당 항목 수',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '결제 내역을 반환합니다.',
    schema: {
      type: 'object',
      properties: {
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              payment_id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614174000',
              },
              orderId: { type: 'string', example: 'ORDER-12345678' },
              amount: { type: 'number', example: 50000 },
              status: { type: 'string', example: 'DONE' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  async getPaymentHistory(
    @Req() req: Request,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.paymentsService.getPaymentHistory(req.user.id, page, limit);
  }

  @Post(':payment_id/retry')
  @ApiOperation({
    summary: '결제 재시도',
    description: '실패한 결제를 재시도합니다.',
  })
  @ApiParam({ name: 'payment_id', description: '재시도할 결제 ID' })
  @ApiResponse({
    status: 200,
    description: '결제 재시도 정보를 반환합니다.',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'ORDER-12345678' },
        amount: { type: 'number', example: 50000 },
        orderName: { type: 'string', example: '펫 그루밍 서비스 예약' },
        successUrl: {
          type: 'string',
          example: 'https://example.com/payments/success?reservation_id=123',
        },
        failUrl: {
          type: 'string',
          example: 'https://example.com/payments/fail?reservation_id=123',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '재시도 불가능한 결제 상태' })
  @ApiResponse({ status: 404, description: '결제 정보를 찾을 수 없음' })
  async retryPayment(@Param('payment_id') payment_id: string) {
    return this.paymentsService.retryPayment(payment_id);
  }

  @Get('available-times')
  @ApiOperation({ summary: '예약 가능한 시간대 조회' })
  @ApiQuery({
    name: 'businessId',
    description: '비즈니스 ID',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'serviceId',
    description: '서비스 ID',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '예약 가능한 시간대 조회 성공',
  })
  async getAvailableTimeSlots(
    @Query('businessId', ParseUUIDPipe) businessId: string,
    @Query('serviceId', ParseUUIDPipe) serviceId: string,
  ) {
    return this.paymentsService.getAvailableTimeSlots(businessId, serviceId);
  }
}
