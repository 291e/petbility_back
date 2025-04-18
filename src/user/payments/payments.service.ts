import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApprovePaymentDto } from './dto/approve-payment.dto';
import { TossPaymentsService } from '../../toss-payments/toss-payments.service';
import { TossPaymentsError } from '../../toss-payments/toss-payments.error';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tossPaymentsService: TossPaymentsService,
  ) {}

  async createPaymentRequest(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ) {
    const { amount, service_id, business_id, pet_id, start_time, notes } =
      createPaymentDto;

    // 결제 요청 생성
    const payment = await this.prisma.payment.create({
      data: {
        user_id: userId,
        amount,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.CARD, // 기본값으로 CARD 설정
        service_id,
        business_id,
        orderId: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        metadata: {
          pet_id,
          start_time,
          notes,
        } as any,
      },
    });

    // 토스페이먼츠 결제 요청 생성 (테스트용)
    // 실제 환경에서는 클라이언트에서 결제 요청을 생성해야 함
    return {
      ...payment,
      paymentKey: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq`,
      successUrl: `${process.env.FRONTEND_URL}/payments/success?orderId=${payment.payment_id}`,
      failUrl: `${process.env.FRONTEND_URL}/payments/fail?orderId=${payment.payment_id}`,
    };
  }

  async confirmPayment(approvePaymentDto: ApprovePaymentDto) {
    const { paymentKey, orderId, amount } = approvePaymentDto;

    // 결제 정보 조회
    const payment = await this.prisma.payment.findFirst({
      where: { orderId: orderId },
    });

    if (!payment) {
      throw new TossPaymentsError(
        '결제 정보를 찾을 수 없습니다.',
        'PAYMENT_NOT_FOUND',
      );
    }

    if (Number(payment.amount) !== amount) {
      throw new TossPaymentsError(
        '결제 금액이 일치하지 않습니다.',
        'INVALID_AMOUNT',
      );
    }

    // 토스페이먼츠 결제 승인
    const tossPayment =
      await this.tossPaymentsService.approvePayment(approvePaymentDto);

    // 결제 정보 업데이트
    const updatedPayment = await this.prisma.payment.update({
      where: { payment_id: payment.payment_id },
      data: {
        status: PaymentStatus.DONE,
        approved_at: new Date(),
        method: tossPayment.method as PaymentMethod,
        paymentKey: paymentKey,
        metadata: {
          ...(payment.metadata as any),
          method_detail: tossPayment.methodDetail,
          virtual_account_info: tossPayment.virtualAccountInfo,
          card_info: tossPayment.cardInfo,
          receipt_url: tossPayment.receiptUrl,
        } as any,
      },
    });

    // 예약 정보 생성
    const reservation = await this.createReservationFromPayment(updatedPayment);

    return {
      ...updatedPayment,
      reservation_id: reservation.reservation_id,
    };
  }

  /**
   * 결제 ID로 결제 정보를 조회합니다.
   * @param paymentId 결제 ID
   * @returns 결제 정보
   */
  async getPaymentById(paymentId: string) {
    return this.prisma.payment.findUnique({
      where: { payment_id: paymentId },
    });
  }

  /**
   * 결제 정보로부터 예약 정보를 생성합니다.
   * @param payment 결제 정보
   * @returns 생성된 예약 정보
   */
  async createReservationFromPayment(payment: any) {
    const metadata = payment.metadata as any;
    const { pet_id, start_time, notes } = metadata;

    // 서비스 정보 조회
    const service = await this.prisma.service.findUnique({
      where: { service_id: payment.service_id },
    });

    if (!service) {
      throw new TossPaymentsError(
        '서비스 정보를 찾을 수 없습니다.',
        'SERVICE_NOT_FOUND',
      );
    }

    // 예약 종료 시간 계산 (기본 1시간)
    const startTime = new Date(start_time);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1); // 기본 1시간으로 설정

    // 예약 정보 생성
    const reservation = await this.prisma.reservation.create({
      data: {
        user_id: payment.user_id,
        service_id: payment.service_id,
        business_id: payment.business_id,
        pet_id,
        start_time: startTime,
        end_time: endTime,
        status: 'CONFIRMED',
        price: payment.amount,
        notes,
        payments: {
          connect: { payment_id: payment.payment_id },
        },
      },
    });

    return reservation;
  }

  async cancelPayment(paymentId: string, cancelReason: string) {
    // 결제 정보 조회
    const payment = await this.prisma.payment.findUnique({
      where: { payment_id: paymentId },
    });

    if (!payment) {
      throw new TossPaymentsError(
        '결제 정보를 찾을 수 없습니다.',
        'PAYMENT_NOT_FOUND',
      );
    }

    if (payment.status !== PaymentStatus.DONE) {
      throw new TossPaymentsError(
        '취소할 수 없는 결제 상태입니다.',
        'INVALID_PAYMENT_STATUS',
      );
    }

    // 토스페이먼츠 결제 취소
    if (payment.paymentKey) {
      await this.tossPaymentsService.cancelPayment(
        payment.paymentKey,
        cancelReason,
      );
    }

    // 결제 정보 업데이트
    const updatedPayment = await this.prisma.payment.update({
      where: { payment_id: paymentId },
      data: {
        status: PaymentStatus.CANCELED,
        canceled_at: new Date(),
        cancel_reason: cancelReason,
      },
    });

    // 예약 상태 업데이트
    await this.prisma.reservation.updateMany({
      where: {
        payments: {
          some: {
            payment_id: paymentId,
          },
        },
      },
      data: { status: 'CANCELED' },
    });

    return updatedPayment;
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { payment_id: paymentId },
    });

    if (!payment) {
      throw new TossPaymentsError(
        '결제 정보를 찾을 수 없습니다.',
        'PAYMENT_NOT_FOUND',
      );
    }

    return {
      payment_id: payment.payment_id,
      status: payment.status,
      amount: payment.amount,
      requested_at: payment.requested_at,
    };
  }

  async getPaymentHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { user_id: userId },
        orderBy: { requested_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({
        where: { user_id: userId },
      }),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async retryPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { payment_id: paymentId },
    });

    if (!payment) {
      throw new TossPaymentsError(
        '결제 정보를 찾을 수 없습니다.',
        'PAYMENT_NOT_FOUND',
      );
    }

    if (payment.status !== PaymentStatus.FAILED) {
      throw new TossPaymentsError(
        '재시도할 수 없는 결제 상태입니다.',
        'INVALID_PAYMENT_STATUS',
      );
    }

    // 토스페이먼츠 결제 요청 생성
    const tossPayment = await this.tossPaymentsService.getPayment(
      payment.payment_id,
    );

    return {
      orderId: payment.payment_id,
      amount: payment.amount,
      orderName: (payment.metadata as any)?.orderName || '결제 재시도',
      successUrl: tossPayment.successUrl,
      failUrl: tossPayment.failUrl,
    };
  }

  async getAvailableTimeSlots(businessId: string, serviceId: string) {
    // 비즈니스 정보 조회
    const business = await this.prisma.user.findUnique({
      where: { user_id: businessId },
      include: {
        businessSchedules: true,
      },
    });

    if (!business) {
      throw new TossPaymentsError(
        '비즈니스 정보를 찾을 수 없습니다.',
        'BUSINESS_NOT_FOUND',
      );
    }

    // 서비스 정보 조회
    const service = await this.prisma.service.findUnique({
      where: { service_id: serviceId },
    });

    if (!service) {
      throw new TossPaymentsError(
        '서비스 정보를 찾을 수 없습니다.',
        'SERVICE_NOT_FOUND',
      );
    }

    // 이미 예약된 시간 조회
    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        business_id: businessId,
        service_id: serviceId,
        start_time: {
          gte: new Date(),
        },
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
      select: {
        start_time: true,
      },
    });

    // 예약 가능한 시간대 계산
    const availableTimeSlots = this.calculateAvailableTimeSlots(
      business.businessSchedules,
      service.price,
      existingReservations.map((r) => r.start_time),
    );

    return availableTimeSlots;
  }

  private calculateAvailableTimeSlots(
    businessSchedules: any[],
    servicePrice: any,
    existingReservations: Date[],
  ) {
    // TODO: 비즈니스 영업시간과 서비스 소요시간을 기반으로 예약 가능한 시간대 계산
    return [];
  }
}
