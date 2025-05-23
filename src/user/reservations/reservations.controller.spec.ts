import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationStatus } from '@prisma/client';
import { Request } from 'express';
import { addHours } from 'date-fns';
import { AuthGuard } from '@/auth/auth.guard';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';

// NotificationsService 모킹
jest.mock('@/notifications/notifications.service', () => {
  return {
    NotificationsService: jest.fn().mockImplementation(() => {
      return {
        create: jest.fn().mockResolvedValue({}),
      };
    }),
  };
});

// Request 타입의 모의 객체를 생성하는 헬퍼 함수
function createMockRequest(user: any): Request {
  return {
    user,
  } as Request;
}

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let service: ReservationsService;

  const mockReservationData = {
    reservation_id: 'test-reservation-id',
    user_id: 'test-user-id',
    service_id: 'test-service-id',
    pet_id: 'test-pet-id',
    business_id: 'test-business-id',
    start_time: addHours(new Date(), 25),
    end_time: addHours(new Date(), 26),
    status: ReservationStatus.PENDING,
    price: 30000,
    notes: '테스트 예약입니다.',
    is_available: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReservationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    getAllServices: jest.fn(),
    getBusinessesByService: jest.fn(),
    getAvailableSchedule: jest.fn(),
    getDisabledDates: jest.fn(),
    getAvailableTimesByDate: jest.fn(),
    getUserPets: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    reservation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useFactory: () => ({
            create: jest.fn().mockResolvedValue({}),
          }),
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReservationsController>(ReservationsController);
    service = module.get<ReservationsService>(ReservationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createReservationDto: CreateReservationDto = {
      service_id: 'test-service-id',
      pet_id: 'test-pet-id',
      start_time: addHours(new Date(), 25).toISOString(),
      end_time: addHours(new Date(), 26).toISOString(),
      notes: '테스트 예약입니다.',
    };

    const mockRequest = createMockRequest({ id: 'test-user-id' });

    it('should create a reservation', async () => {
      mockReservationsService.create.mockResolvedValue(mockReservationData);

      const result = await controller.create(createReservationDto, mockRequest);

      expect(result).toEqual(mockReservationData);
      expect(mockReservationsService.create).toHaveBeenCalledWith(
        'test-user-id',
        createReservationDto,
      );
    });
  });

  describe('findAll', () => {
    const mockRequest = createMockRequest({ id: 'test-user-id' });

    it('should return an array of reservations', async () => {
      const mockReservations = [mockReservationData];
      mockReservationsService.findAll.mockResolvedValue(mockReservations);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockReservations);
      expect(mockReservationsService.findAll).toHaveBeenCalledWith(
        'test-user-id',
      );
    });
  });

  describe('findOne', () => {
    const mockRequest = createMockRequest({ id: 'test-user-id' });

    it('should return a reservation by id', async () => {
      mockReservationsService.findOne.mockResolvedValue(mockReservationData);

      const result = await controller.findOne(
        'test-reservation-id',
        mockRequest,
      );

      expect(result).toEqual(mockReservationData);
      expect(mockReservationsService.findOne).toHaveBeenCalledWith(
        'test-reservation-id',
        'test-user-id',
      );
    });
  });

  describe('update', () => {
    const updateReservationDto: UpdateReservationDto = {
      start_time: addHours(new Date(), 26).toISOString(),
      end_time: addHours(new Date(), 27).toISOString(),
      notes: '수정된 테스트 예약입니다.',
    };

    const mockRequest = createMockRequest({ id: 'test-user-id' });

    it('should update a reservation', async () => {
      const updatedReservation = {
        ...mockReservationData,
        notes: updateReservationDto.notes,
        start_time: updateReservationDto.start_time
          ? new Date(updateReservationDto.start_time)
          : mockReservationData.start_time,
        end_time: updateReservationDto.end_time
          ? new Date(updateReservationDto.end_time)
          : mockReservationData.end_time,
      };

      mockReservationsService.update.mockResolvedValue(updatedReservation);

      const result = await controller.update(
        'test-reservation-id',
        updateReservationDto,
        mockRequest,
      );

      expect(result).toEqual(updatedReservation);
      expect(mockReservationsService.update).toHaveBeenCalledWith(
        'test-reservation-id',
        'test-user-id',
        updateReservationDto,
      );
    });
  });

  describe('cancel', () => {
    const mockRequest = createMockRequest({ id: 'test-user-id' });

    it('should cancel a reservation', async () => {
      const canceledReservation = {
        ...mockReservationData,
        status: ReservationStatus.CANCELED,
      };
      mockReservationsService.cancel.mockResolvedValue(canceledReservation);

      const result = await controller.cancel(
        'test-reservation-id',
        mockRequest,
      );

      expect(result).toEqual(canceledReservation);
      expect(mockReservationsService.cancel).toHaveBeenCalledWith(
        'test-reservation-id',
        'test-user-id',
      );
    });

    it('should handle reservation block removal', async () => {
      const successResponse = {
        success: true,
        message: '차단 시간이 삭제되었습니다.',
      };
      mockReservationsService.cancel.mockResolvedValue(successResponse);

      const result = await controller.cancel('blocked-time-id', mockRequest);

      expect(result).toEqual(successResponse);
      expect(mockReservationsService.cancel).toHaveBeenCalledWith(
        'blocked-time-id',
        'test-user-id',
      );
    });
  });

  describe('getAllServices', () => {
    it('should return all services', async () => {
      const mockServices = [
        {
          service_id: 'service-1',
          name: '강아지 목욕',
          description: '반려견 목욕 서비스입니다.',
          price: 30000,
          category: 'grooming',
          admin: {
            id: 'admin-1',
            name: '펫샵 A',
          },
        },
      ];

      mockReservationsService.getAllServices.mockResolvedValue(mockServices);

      const result = await controller.getAllServices();
      expect(result).toEqual(mockServices);
      expect(mockReservationsService.getAllServices).toHaveBeenCalled();
    });
  });

  describe('getUserPets', () => {
    const mockRequest = createMockRequest({ id: 'test-user-id' });

    it('should return user pets', async () => {
      const mockPets = [
        {
          pet_id: 'pet-1',
          name: '멍멍이',
          breed: '말티즈',
          user_id: 'test-user-id',
        },
      ];

      mockReservationsService.getUserPets.mockResolvedValue(mockPets);

      const result = await controller.getUserPets(mockRequest);
      expect(result).toEqual(mockPets);
      expect(mockReservationsService.getUserPets).toHaveBeenCalledWith(
        'test-user-id',
      );
    });
  });

  describe('getAvailableSchedule', () => {
    it('should return available schedule', async () => {
      const mockSchedule = {
        date: '2023-01-01',
        available_time_slots: ['10:00', '10:30', '11:00'],
      };

      mockReservationsService.getAvailableSchedule.mockResolvedValue(
        mockSchedule,
      );

      const result = await controller.getAvailableSchedule(
        'business-1',
        'service-1',
        '2023-01-01',
      );

      expect(result).toEqual(mockSchedule);
      expect(mockReservationsService.getAvailableSchedule).toHaveBeenCalledWith(
        'business-1',
        'service-1',
        '2023-01-01',
      );
    });
  });
});
