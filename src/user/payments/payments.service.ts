import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApprovePaymentDto } from './dto/approve-payment.dto';
import { TossPaymentsService } from '../../toss-payments/toss-payments.service';
import { TossPaymentsError } from '../../toss-payments/toss-payments.error';
import {
  PaymentStatus,
  PaymentMethod,
  ReservationStatus,
} from './dto/payment.enums'; // enum 분리
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

// --- [타입 정의] ---
interface PaymentMetadata {
  pet_id: string;
  start_time: string;
  notes?: string;
  service_name?: string;
  service_price?: Prisma.Decimal;
  [key: string]: any;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly tossSecretKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tossPaymentsService: TossPaymentsService,
    private readonly configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('TOSS_SECRET_KEY');
    if (!secretKey) {
      throw new Error('TOSS_SECRET_KEY is not defined');
    }
    this.tossSecretKey = secretKey;
  }

  // [결제 요청]
  async createPaymentRequest(userId: string, dto: CreatePaymentDto) {
    const { amount, service_id, business_id, pet_id, start_time, notes } = dto;

    // 트랜잭션 처리 (예약 중복 방지, 결제 생성 동시)
    return await this.prisma.$transaction(async (tx) => {
      // 1. 서비스 유효성 체크
      const service = await tx.service.findUnique({ where: { service_id } });
      if (!service)
        throw new TossPaymentsError(
          '서비스 정보를 찾을 수 없습니다.',
          'SERVICE_NOT_FOUND',
        );

      // 2. [예약 중복 방지] - 동일 비즈니스/서비스/시간대/펫에 대해 CONFIRMED 또는 PENDING 예약이 있으면 예외!
      const startTime = new Date(start_time); // 반드시 ISO-8601(UTC)로 넘기세요!
      const duplicate = await tx.reservation.findFirst({
        where: {
          business_id,
          service_id,
          pet_id,
          start_time,
          status: {
            in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
          },
        },
      });
      if (duplicate) {
        throw new ConflictException('이미 해당 시간에 예약이 존재합니다.');
      }

      // 3. 결제 정보 생성
      const payment = await tx.payment.create({
        data: {
          user_id: userId,
          amount,
          status: PaymentStatus.PENDING,
          method: PaymentMethod.CARD,
          service_id,
          business_id,
          orderId: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          metadata: <PaymentMetadata>{
            pet_id,
            start_time,
            notes,
            service_name: service.name,
            service_price: service.price,
          },
        },
      });

      this.logger.log(
        `[결제요청] 생성: user=${userId}, orderId=${payment.orderId}`,
      );

      return {
        ...payment,
        paymentKey: this.tossSecretKey,
        successUrl: `${process.env.FRONTEND_URL}/payments/success?orderId=${payment.orderId}`,
        failUrl: `${process.env.FRONTEND_URL}/payments/fail?orderId=${payment.orderId}`,
      };
    });
  }

  // [결제 승인]
  async confirmPayment(dto: ApprovePaymentDto) {
    const { paymentKey, orderId, amount } = dto;

    try {
      // 트랜잭션 처리 (결제 승인, 결제/예약 정보 업데이트)
      return await this.prisma.$transaction(async (tx) => {
        // 1. 결제 정보 조회
        const payment = await tx.payment.findFirst({
          where: { orderId },
          include: { service: true, business: true },
        });
        if (!payment) {
          this.logger.error(`결제 정보를 찾을 수 없음: orderId=${orderId}`);
          throw new TossPaymentsError(
            '결제 정보를 찾을 수 없습니다.',
            'PAYMENT_NOT_FOUND',
          );
        }

        if (Number(payment.amount) !== amount) {
          this.logger.error(
            `결제 금액 불일치: expected=${payment.amount}, actual=${amount}`,
          );
          throw new TossPaymentsError('결제 금액 불일치', 'INVALID_AMOUNT');
        }

        if (payment.status !== PaymentStatus.PENDING) {
          this.logger.error(
            `이미 처리된 결제: status=${payment.status}, orderId=${orderId}`,
          );
          throw new TossPaymentsError(
            '이미 처리된 결제입니다.',
            'DUPLICATE_PAYMENT',
          );
        }

        if (!payment.service_id || !payment.business_id) {
          this.logger.error(
            `서비스/비즈니스 정보 누락: service_id=${payment.service_id}, business_id=${payment.business_id}`,
          );
          throw new TossPaymentsError(
            '서비스 또는 비즈니스 정보가 없습니다.',
            'INVALID_PAYMENT_DATA',
          );
        }

        // 2. TossPayments 결제 승인
        this.logger.log(`토스페이먼츠 결제 승인 요청: orderId=${orderId}`);
        const tossPayment = await this.tossPaymentsService.approvePayment(dto);
        this.logger.log(`토스페이먼츠 결제 승인 성공: orderId=${orderId}`);

        // 3. 결제 정보 업데이트
        const updatedPayment = await tx.payment.update({
          where: { payment_id: payment.payment_id },
          data: {
            status: PaymentStatus.DONE,
            approved_at: new Date(),
            method:
              tossPayment.method === '간편결제'
                ? 'EASY_PAY'
                : tossPayment.method,
            paymentKey: paymentKey,
            metadata: {
              ...(payment.metadata as PaymentMetadata),
              method_detail: tossPayment.methodDetail,
              receipt_url: tossPayment.receiptUrl,
              toss_payment_response: tossPayment,
            },
          },
        });

        // 4. [예약 생성] - 중복 방지(트랜잭션 보장)
        let reservation: Prisma.ReservationGetPayload<{}> | null = null;
        try {
          reservation = await tx.reservation.create({
            data: {
              user_id: payment.user_id,
              service_id: payment.service_id,
              business_id: payment.business_id,
              pet_id: (payment.metadata as PaymentMetadata).pet_id,
              start_time: new Date(
                (payment.metadata as PaymentMetadata).start_time,
              ),
              end_time: this.addHour(
                (payment.metadata as PaymentMetadata).start_time,
                1,
              ),
              status: ReservationStatus.CONFIRMED,
              price: payment.amount,
              notes: (payment.metadata as PaymentMetadata).notes,
              payment_id: payment.payment_id,
            },
          });
          this.logger.log(
            `[예약생성] 성공: reservation_id=${reservation.reservation_id}`,
          );
        } catch (reservationError) {
          // 예약 생성 실패해도 결제는 승인처리 (관리자 수동 확인)
          this.logger.error(
            `[예약생성실패] orderId=${orderId} err=${reservationError.message}`,
          );
        }

        return {
          success: true,
          data: {
            ...updatedPayment,
            reservation_id: reservation?.reservation_id,
          },
        };
      });
    } catch (error) {
      this.logger.error(
        `결제 승인 처리 실패: orderId=${orderId}, error=${error.message}`,
      );
      if (error instanceof TossPaymentsError) {
        throw error;
      }
      throw new TossPaymentsError(
        '결제 승인 처리 중 오류가 발생했습니다.',
        'UNKNOWN_ERROR',
      );
    }
  }

  // [결제 취소]
  async cancelPayment(paymentId: string, cancelReason: string) {
    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { payment_id: paymentId },
      });
      if (!payment)
        throw new TossPaymentsError(
          '결제 정보를 찾을 수 없습니다.',
          'PAYMENT_NOT_FOUND',
        );
      if (payment.status !== PaymentStatus.DONE)
        throw new TossPaymentsError(
          '취소할 수 없는 결제 상태입니다.',
          'INVALID_PAYMENT_STATUS',
        );

      if (!payment.paymentKey) {
        throw new TossPaymentsError(
          '결제 키가 존재하지 않습니다.',
          'INVALID_PAYMENT_KEY',
        );
      }

      // Toss 결제 취소 (응답체크)
      await this.tossPaymentsService.cancelPayment(
        payment.paymentKey,
        cancelReason,
      );

      // 결제 취소/예약 취소 동시
      await Promise.all([
        tx.payment.update({
          where: { payment_id: paymentId },
          data: {
            status: PaymentStatus.CANCELED,
            canceled_at: new Date(),
            cancel_reason: cancelReason,
          },
        }),
        tx.reservation.updateMany({
          where: { payment_id: paymentId },
          data: { status: ReservationStatus.CANCELED },
        }),
      ]);
      this.logger.log(`[결제취소] payment_id=${paymentId}`);

      return { ok: true };
    });
  }

  // 예약 종료 시간 계산 (ex: 1시간 추가)
  private addHour(dateString: string, hour: number) {
    const date = new Date(dateString);
    date.setHours(date.getHours() + hour);
    return date;
  }
}
