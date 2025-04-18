import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { NotificationsService } from '@/notifications/notifications.service';
import { TossPaymentsService } from '@/toss-payments/toss-payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApprovePaymentDto } from './dto/approve-payment.dto';
import {
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
} from '@prisma/client';
import { of } from 'rxjs';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// 모킹 함수들
const mockPrismaService = () => ({
  service: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  reservation: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
});

const mockHttpService = () => ({
  axiosRef: {
    post: jest.fn(),
  },
});

const mockNotificationsService = () => ({
  create: jest.fn(),
});

const mockTossPaymentsService = () => ({
  approvePayment: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn(),
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService;
  let httpService;
  let notificationsService;
  let tossPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: HttpService, useFactory: mockHttpService },
        { provide: NotificationsService, useFactory: mockNotificationsService },
        { provide: TossPaymentsService, useFactory: mockTossPaymentsService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    httpService = module.get<HttpService>(HttpService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
    tossPaymentsService = module.get<TossPaymentsService>(TossPaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentRequest', () => {
    it('서비스 ID가 유효하지 않은 경우 예외를 발생시킨다', async () => {
      // 준비
      const userId = 'user-id';
      const createPaymentDto: CreatePaymentDto = {
        service_id: 'service-id',
        business_id: 'business-id',
        pet_id: 'pet-id',
        method: PaymentMethod.CARD,
        amount: 50000,
        start_time: '2023-12-31T15:00:00Z',
      };

      prismaService.service.findUnique.mockResolvedValue(null);

      // 실행 및 검증
      await expect(
        service.createPaymentRequest(userId, createPaymentDto),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.service.findUnique).toHaveBeenCalledWith({
        where: { service_id: createPaymentDto.service_id },
      });
    });

    it('비즈니스 ID가 유효하지 않은 경우 예외를 발생시킨다', async () => {
      // 준비
      const userId = 'user-id';
      const createPaymentDto: CreatePaymentDto = {
        service_id: 'service-id',
        business_id: 'business-id',
        pet_id: 'pet-id',
        method: PaymentMethod.CARD,
        amount: 50000,
        start_time: '2023-12-31T15:00:00Z',
      };

      prismaService.service.findUnique.mockResolvedValue({
        service_id: 'service-id',
        name: '서비스명',
      });
      prismaService.user.findUnique.mockResolvedValue(null);

      // 실행 및 검증
      await expect(
        service.createPaymentRequest(userId, createPaymentDto),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { user_id: createPaymentDto.business_id },
      });
    });

    it('사용자 ID가 유효하지 않은 경우 예외를 발생시킨다', async () => {
      // 준비
      const userId = 'user-id';
      const createPaymentDto: CreatePaymentDto = {
        service_id: 'service-id',
        business_id: 'business-id',
        pet_id: 'pet-id',
        method: PaymentMethod.CARD,
        amount: 50000,
        start_time: '2023-12-31T15:00:00Z',
      };

      prismaService.service.findUnique.mockResolvedValue({
        service_id: 'service-id',
        name: '서비스명',
      });
      prismaService.user.findUnique.mockImplementation((params) => {
        if (params.where.user_id === createPaymentDto.business_id) {
          return { user_id: 'business-id', name: '비즈니스' };
        }
        return null;
      });

      // 실행 및 검증
      await expect(
        service.createPaymentRequest(userId, createPaymentDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('과거 시간으로 예약하는 경우 예외를 발생시킨다', async () => {
      // 준비
      const userId = 'user-id';
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // 하루 전

      const createPaymentDto: CreatePaymentDto = {
        service_id: 'service-id',
        business_id: 'business-id',
        pet_id: 'pet-id',
        method: PaymentMethod.CARD,
        amount: 50000,
        start_time: pastDate.toISOString(),
      };

      prismaService.service.findUnique.mockResolvedValue({
        service_id: 'service-id',
        name: '서비스명',
      });
      prismaService.user.findUnique.mockImplementation((params) => {
        if (params.where.user_id === createPaymentDto.business_id) {
          return { user_id: 'business-id', name: '비즈니스' };
        }
        return { user_id: 'user-id', name: '사용자' };
      });

      // 실행 및 검증
      await expect(
        service.createPaymentRequest(userId, createPaymentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    it('결제 정보가 없는 경우 예외를 발생시킨다', async () => {
      // 준비
      const approvePaymentDto: ApprovePaymentDto = {
        paymentKey: 'payment-key',
        orderId: 'order-id',
        amount: 50000,
      };

      prismaService.payment.findFirst.mockResolvedValue(null);

      // 실행 및 검증
      await expect(service.confirmPayment(approvePaymentDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.payment.findFirst).toHaveBeenCalledWith({
        where: {
          paymentKey: approvePaymentDto.paymentKey,
          orderId: approvePaymentDto.orderId,
          amount: approvePaymentDto.amount,
        },
      });
    });

    it('결제 금액이 일치하지 않는 경우 예외를 발생시킨다', async () => {
      // 준비
      const approvePaymentDto: ApprovePaymentDto = {
        paymentKey: 'payment-key',
        orderId: 'order-id',
        amount: 50000,
      };

      prismaService.payment.findFirst.mockResolvedValue({
        payment_id: 'payment-id',
        paymentKey: 'payment-key',
        orderId: 'order-id',
        amount: 40000, // 다른 금액
        status: PaymentStatus.PENDING,
        requested_at: new Date(),
      });

      // 실행 및 검증
      await expect(service.confirmPayment(approvePaymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
