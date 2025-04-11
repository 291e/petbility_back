import { Test, TestingModule } from '@nestjs/testing';
import { BusinessReservationsService } from './business-reservations.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReservationStatus, ServiceCategory } from '@prisma/client';

// 모킹 데이터
const mockReservations = [
  {
    reservation_id: '1',
    user_id: 'user1',
    business_id: 'business1',
    service_id: 'service1',
    pet_id: 'pet1',
    start_time: new Date('2023-01-01T10:00:00Z'),
    end_time: new Date('2023-01-01T11:00:00Z'),
    status: ReservationStatus.PENDING,
    is_available: true,
    price: 10000,
    created_at: new Date(),
    updated_at: new Date(),
    notes: null,
  },
  {
    reservation_id: '2',
    user_id: 'user2',
    business_id: 'business1',
    service_id: 'service2',
    pet_id: 'pet2',
    start_time: new Date('2023-01-01T12:00:00Z'),
    end_time: new Date('2023-01-01T13:00:00Z'),
    status: ReservationStatus.CONFIRMED,
    is_available: true,
    price: 20000,
    created_at: new Date(),
    updated_at: new Date(),
    notes: null,
  },
];

// PrismaService 모킹
const mockPrismaService = {
  reservation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  service: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  businessService: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// NotificationsService 모킹
const mockNotificationsService = {
  create: jest.fn(),
};

describe('BusinessReservationsService', () => {
  let service: BusinessReservationsService;
  let prismaService: PrismaService;
  let notificationsService: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessReservationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<BusinessReservationsService>(
      BusinessReservationsService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all reservations for a business', async () => {
      const mockReservations = [
        {
          reservation_id: 'test-id',
          business_id: 'test-business-id',
          user_id: 'test-user-id',
          status: ReservationStatus.PENDING,
        },
      ];

      mockPrismaService.reservation.findMany.mockResolvedValue(
        mockReservations,
      );

      const result = await service.findAll('test-business-id');
      expect(result).toEqual(mockReservations);
      expect(mockPrismaService.reservation.findMany).toHaveBeenCalledWith({
        where: {
          business_id: 'test-business-id',
          is_available: true,
        },
        include: {
          user: {
            select: { user_id: true, name: true, phone: true, address: true },
          },
          pet: true,
          service: true,
        },
        orderBy: { start_time: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a reservation if it exists and belongs to the business', async () => {
      const mockReservation = {
        reservation_id: 'test-id',
        business_id: 'test-business-id',
        user_id: 'test-user-id',
        status: ReservationStatus.PENDING,
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      const result = await service.findOne('test-id', 'test-business-id');
      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', 'test-business-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if reservation does not belong to the business', async () => {
      const mockReservation = {
        reservation_id: 'test-id',
        business_id: 'other-business-id',
        user_id: 'test-user-id',
        status: ReservationStatus.PENDING,
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      await expect(
        service.findOne('test-id', 'test-business-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update reservation status', async () => {
      // 모킹
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservations[0],
      );
      mockPrismaService.reservation.update.mockResolvedValue({
        ...mockReservations[0],
        status: ReservationStatus.CONFIRMED,
      });
      mockNotificationsService.create.mockResolvedValue({});

      // 테스트
      const result = await service.updateStatus('1', 'business1', {
        status: ReservationStatus.CONFIRMED,
      });

      // 검증
      expect(mockPrismaService.reservation.update).toHaveBeenCalledWith({
        where: { reservation_id: '1' },
        data: { status: ReservationStatus.CONFIRMED },
        include: {
          user: true,
          service: true,
          pet: true,
        },
      });
      expect(mockNotificationsService.create).toHaveBeenCalled();
      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });
  });

  // 서비스 관리 테스트 추가
  describe('getBusinessServices', () => {
    it('should return list of services with activation status', async () => {
      // 테스트 데이터 설정
      const businessId = 'test-business-id';

      // 활성화된 서비스 모의 데이터
      const mockActiveServices = [
        {
          business_id: businessId,
          service_id: 'service1',
          service: {
            service_id: 'service1',
            name: '서비스1',
            description: '설명1',
            price: 10000,
            category: ServiceCategory.grooming,
          },
        },
      ];

      // 카테고리별 기본 서비스 모의 데이터
      const mockBaseService = {
        service_id: 'base-service-id',
        name: '기본 서비스',
        description: '기본 서비스 설명',
        price: 20000,
        category: ServiceCategory.cremation,
      };

      // 모의 함수 설정
      mockPrismaService.businessService.findMany.mockResolvedValue(
        mockActiveServices,
      );
      mockPrismaService.service.findFirst.mockResolvedValue(mockBaseService);

      // 함수 실행
      const result = await service.getBusinessServices(businessId);

      // 결과 검증
      expect(mockPrismaService.businessService.findMany).toHaveBeenCalledWith({
        where: { business_id: businessId },
        include: { service: true },
      });

      // 적어도 하나 이상의 서비스가 결과에 포함되어야 함
      expect(result.length).toBeGreaterThan(0);

      // 결과에 서비스 정보와 상태가 포함되어 있는지 확인
      expect(result[0]).toHaveProperty('service_id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('status');
    });
  });

  describe('updateServiceStatus', () => {
    const businessId = 'test-business-id';
    const serviceId = 'test-service-id';

    it('should activate a service', async () => {
      // 테스트 서비스 설정
      const mockService = {
        service_id: serviceId,
        name: '테스트 서비스',
      };

      // 이미 존재하는 BusinessService 링크
      const mockExistingLink = {
        id: 'link-id',
        business_id: businessId,
        service_id: serviceId,
        is_active: false,
      };

      // 업데이트 결과
      const mockUpdatedLink = {
        ...mockExistingLink,
        is_active: true,
      };

      // 모의 함수 설정
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.businessService.findFirst.mockResolvedValue(
        mockExistingLink,
      );
      mockPrismaService.businessService.update.mockResolvedValue(
        mockUpdatedLink,
      );

      // 함수 실행
      const result = await service.updateServiceStatus(
        businessId,
        serviceId,
        'active',
      );

      // 결과 검증
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { service_id: serviceId },
      });

      expect(mockPrismaService.businessService.findFirst).toHaveBeenCalledWith({
        where: {
          business_id: businessId,
          service_id: serviceId,
        },
      });

      expect(mockPrismaService.businessService.update).toHaveBeenCalledWith({
        where: { id: mockExistingLink.id },
        data: { is_active: true },
      });

      expect(result).toEqual(mockUpdatedLink);
    });

    it('should create a new link if it does not exist when activating', async () => {
      // 테스트 서비스 설정
      const mockService = {
        service_id: serviceId,
        name: '테스트 서비스',
      };

      // 생성 결과
      const mockCreatedLink = {
        id: 'new-link-id',
        business_id: businessId,
        service_id: serviceId,
        is_active: true,
      };

      // 모의 함수 설정
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.businessService.findFirst.mockResolvedValue(null); // 링크가 없음
      mockPrismaService.businessService.create.mockResolvedValue(
        mockCreatedLink,
      );

      // 함수 실행
      const result = await service.updateServiceStatus(
        businessId,
        serviceId,
        'active',
      );

      // 결과 검증
      expect(mockPrismaService.businessService.create).toHaveBeenCalledWith({
        data: {
          business_id: businessId,
          service_id: serviceId,
          is_active: true,
        },
      });

      expect(result).toEqual(mockCreatedLink);
    });

    it('should deactivate a service', async () => {
      // 테스트 서비스 설정
      const mockService = {
        service_id: serviceId,
        name: '테스트 서비스',
      };

      // 이미 존재하는 BusinessService 링크
      const mockExistingLink = {
        id: 'link-id',
        business_id: businessId,
        service_id: serviceId,
        is_active: true,
      };

      // 업데이트 결과
      const mockUpdatedLink = {
        ...mockExistingLink,
        is_active: false,
      };

      // 모의 함수 설정
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.businessService.findFirst.mockResolvedValue(
        mockExistingLink,
      );
      mockPrismaService.businessService.update.mockResolvedValue(
        mockUpdatedLink,
      );

      // 함수 실행
      const result = await service.updateServiceStatus(
        businessId,
        serviceId,
        'inactive',
      );

      // 결과 검증
      expect(mockPrismaService.businessService.update).toHaveBeenCalledWith({
        where: { id: mockExistingLink.id },
        data: { is_active: false },
      });

      expect(result).toEqual(mockUpdatedLink);
    });

    it('should return a message when deactivating a non-existent link', async () => {
      // 테스트 서비스 설정
      const mockService = {
        service_id: serviceId,
        name: '테스트 서비스',
      };

      // 모의 함수 설정
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.businessService.findFirst.mockResolvedValue(null); // 링크가 없음

      // 함수 실행
      const result = await service.updateServiceStatus(
        businessId,
        serviceId,
        'inactive',
      );

      // 결과 검증
      expect(result).toEqual({ message: '이미 비활성화된 서비스입니다.' });
    });

    it('should throw NotFoundException for non-existent service', async () => {
      // 모의 함수 설정
      mockPrismaService.service.findUnique.mockResolvedValue(null); // 서비스가 없음

      // 함수 실행 및 예외 확인
      await expect(
        service.updateServiceStatus(
          businessId,
          'non-existent-service',
          'active',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
