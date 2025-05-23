import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { Request } from 'express';
import { AuthGuard } from '@/auth/auth.guard';
import { ApprovePaymentDto } from './dto/approve-payment.dto';
import { TossPaymentsError } from '@/toss-payments/toss-payments.error';

@ApiTags('결제')
@Controller('payments')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

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
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다.' })
  async createPaymentRequest(
    @Req() req: Request,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('사용자 ID를 찾을 수 없습니다.');
      }

      const result = await this.paymentsService.createPaymentRequest(
        userId,
        createPaymentDto,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `결제 요청 생성 중 오류: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '결제 요청 생성 중 오류가 발생했습니다.',
      );
    }
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
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 404, description: '결제 정보를 찾을 수 없습니다.' })
  async approvePayment(
    @Body() approvePaymentDto: ApprovePaymentDto,
    @Req() req: Request,
  ) {
    try {
      const { paymentKey, orderId, amount } = approvePaymentDto;
      const userId = req.user.id;

      this.logger.log(`결제 승인 요청: ${orderId}, 금액: ${amount}`);

      const result =
        await this.paymentsService.confirmPayment(approvePaymentDto);

      this.logger.log(`결제 승인 성공: ${orderId}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `결제 승인 처리 중 오류: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof TossPaymentsError) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException(
        '결제 승인 처리 중 오류가 발생했습니다.',
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
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 404, description: '결제 정보를 찾을 수 없습니다.' })
  async cancelPayment(
    @Param('paymentId') paymentId: string,
    @Body() cancelPaymentDto: CancelPaymentDto,
  ) {
    try {
      const result = await this.paymentsService.cancelPayment(
        paymentId,
        cancelPaymentDto.cancel_reason,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `결제 취소 처리 중 오류: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof TossPaymentsError) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException(
        '결제 취소 처리 중 오류가 발생했습니다.',
      );
    }
  }
}
