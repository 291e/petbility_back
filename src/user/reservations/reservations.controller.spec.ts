import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationStatus } from '@prisma/client';
import { Request } from 'express';
import { addHours } from 'date-fns';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { SupabaseService } from '@/auth/supabase/supabase.service';
import { PrismaService } from 'prisma/prisma.service';

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
  };

  const mockSupabaseService = {
    getClient: jest.fn(),
  };

  const mockPrismaService = {
    user: {
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
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SupabaseAuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

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

    const mockRequest = {
      user: { user_id: 'test-user-id' },
    } as Request;

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
    const mockRequest = {
      user: { user_id: 'test-user-id' },
    } as Request;

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
    const mockRequest = {
      user: { user_id: 'test-user-id' },
    } as Request;

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

    const mockRequest = {
      user: { user_id: 'test-user-id' },
    } as Request;

    it('should update a reservation', async () => {
      mockReservationsService.update.mockResolvedValue({
        ...mockReservationData,
        ...updateReservationDto,
        start_time: addHours(new Date(), 26),
        end_time: addHours(new Date(), 27),
      });

      const result = await controller.update(
        'test-reservation-id',
        updateReservationDto,
        mockRequest,
      );

      expect(result).toEqual({
        ...mockReservationData,
        ...updateReservationDto,
        start_time: expect.any(Date),
        end_time: expect.any(Date),
      });
      expect(mockReservationsService.update).toHaveBeenCalledWith(
        'test-reservation-id',
        'test-user-id',
        updateReservationDto,
      );
    });
  });

  describe('cancel', () => {
    const mockRequest = {
      user: { user_id: 'test-user-id' },
    } as Request;

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
      expect((result as { success: boolean }).success).toBe(true);
      expect(mockReservationsService.cancel).toHaveBeenCalledWith(
        'blocked-time-id',
        'test-user-id',
      );
    });
  });
});
