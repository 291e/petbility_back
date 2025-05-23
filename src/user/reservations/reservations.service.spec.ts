import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationStatus, ServiceCategory } from '@prisma/client';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { addHours, addDays } from 'date-fns';

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

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prismaService: PrismaService;
  let notificationsService: NotificationsService;

  const mockServiceData = {
    service_id: 'test-service-id',
    name: '강아지 목욕',
    description: '반려견 목욕 서비스입니다.',
    price: 30000,
    category: 'grooming',
    admin_id: 'test-business-id',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPetData = {
    pet_id: 'test-pet-id',
    name: '멍멍이',
    species: '강아지',
    breed: '말티즈',
    user_id: 'test-user-id',
    created_at: new Date(),
    updated_at: new Date(),
  };

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

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    pet: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    reservation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    businessSchedule: {
      findFirst: jest.fn(),
    },
    businessService: {
      findMany: jest.fn(),
    },
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
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

    service = module.get<ReservationsService>(ReservationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
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

    it('should create a reservation successfully', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPetData,
        user: { id: 'test-user-id' },
      });
      mockPrismaService.reservation.findFirst.mockResolvedValue(null);
      mockPrismaService.reservation.create.mockResolvedValue(
        mockReservationData,
      );

      const result = await service.create('test-user-id', createReservationDto);

      expect(result).toEqual(mockReservationData);
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { service_id: createReservationDto.service_id },
      });
      expect(mockPrismaService.pet.findUnique).toHaveBeenCalledWith({
        where: { pet_id: createReservationDto.pet_id },
        include: { user: true },
      });
      expect(mockPrismaService.reservation.create).toHaveBeenCalledWith({
        data: {
          user_id: 'test-user-id',
          service_id: createReservationDto.service_id,
          pet_id: createReservationDto.pet_id,
          business_id: mockServiceData.admin_id,
          start_time: expect.any(Date),
          end_time: expect.any(Date),
          status: ReservationStatus.PENDING,
          price: mockServiceData.price,
          is_available: true,
          notes: createReservationDto.notes,
        },
      });
      expect(notificationsService.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.create('test-user-id', createReservationDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if pet not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      mockPrismaService.pet.findUnique.mockResolvedValue(null);

      await expect(
        service.create('test-user-id', createReservationDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when pet does not belong to user', async () => {
      const differentUserId = 'different-user-id';
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPetData,
        user_id: differentUserId,
        user: { id: differentUserId },
      });

      await expect(
        service.create('test-user-id', createReservationDto),
      ).rejects.toThrow(
        new BadRequestException('해당 반려동물에 대한 권한이 없습니다.'),
      );
    });

    it('should throw BadRequestException if reservation time is in the past', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const pastReservationDto = {
        ...createReservationDto,
        start_time: pastDate.toISOString(),
        end_time: addHours(pastDate, 1).toISOString(),
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPetData,
        user: { id: 'test-user-id' },
      });

      await expect(
        service.create('test-user-id', pastReservationDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if duplicate reservation exists', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPetData,
        user: { id: 'test-user-id' },
      });
      mockPrismaService.reservation.findFirst.mockResolvedValue(
        mockReservationData,
      );

      await expect(
        service.create('test-user-id', createReservationDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return an array of reservations', async () => {
      const mockReservations = [mockReservationData];
      mockPrismaService.reservation.findMany.mockResolvedValue(
        mockReservations,
      );

      const result = await service.findAll('test-user-id');

      expect(result).toEqual(mockReservations);
      expect(mockPrismaService.reservation.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'test-user-id',
          is_available: true,
        },
        include: {
          service: true,
          pet: true,
          business: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
            },
          },
        },
        orderBy: {
          start_time: 'desc',
        },
      });
    });

    it('should handle onlyAvailable parameter correctly', async () => {
      const mockReservations = [mockReservationData];
      mockPrismaService.reservation.findMany.mockResolvedValue(
        mockReservations,
      );

      const result = await service.findAll('test-user-id', false);

      expect(result).toEqual(mockReservations);
      expect(mockPrismaService.reservation.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'test-user-id',
          is_available: undefined,
        },
        include: {
          service: true,
          pet: true,
          business: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
            },
          },
        },
        orderBy: {
          start_time: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a reservation by id', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservationData,
      );

      const result = await service.findOne(
        'test-reservation-id',
        'test-user-id',
      );

      expect(result).toEqual(mockReservationData);
      expect(mockPrismaService.reservation.findUnique).toHaveBeenCalledWith({
        where: { reservation_id: 'test-reservation-id' },
        include: {
          service: true,
          pet: true,
          business: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if reservation not found', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', 'test-user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have permission', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        ...mockReservationData,
        user_id: 'different-user-id',
      });

      await expect(
        service.findOne('test-reservation-id', 'test-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateReservationDto: UpdateReservationDto = {
      start_time: addHours(new Date(), 26).toISOString(),
      end_time: addHours(new Date(), 27).toISOString(),
      notes: '수정된 테스트 예약입니다.',
    };

    it('should update a reservation successfully', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservationData,
      );

      const updatedData = {
        ...mockReservationData,
        notes: updateReservationDto.notes,
      };

      if (updateReservationDto.start_time) {
        updatedData.start_time = new Date(updateReservationDto.start_time);
      }

      if (updateReservationDto.end_time) {
        updatedData.end_time = new Date(updateReservationDto.end_time);
      }

      mockPrismaService.reservation.update.mockResolvedValue(updatedData);

      const result = await service.update(
        'test-reservation-id',
        'test-user-id',
        updateReservationDto,
      );

      expect(result).toEqual(
        expect.objectContaining({
          notes: updateReservationDto.notes,
          start_time: expect.any(Date),
          end_time: expect.any(Date),
        }),
      );

      expect(mockPrismaService.reservation.update).toHaveBeenCalledWith({
        where: { reservation_id: 'test-reservation-id' },
        data: expect.objectContaining({
          notes: updateReservationDto.notes,
        }),
        include: {
          service: true,
          pet: true,
        },
      });
      expect(notificationsService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if reservation is not in PENDING status', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        ...mockReservationData,
        status: ReservationStatus.CONFIRMED,
      });

      await expect(
        service.update(
          'test-reservation-id',
          'test-user-id',
          updateReservationDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to update past reservation', async () => {
      const pastReservation = {
        ...mockReservationData,
        start_time: new Date(Date.now() - 1000),
        end_time: addHours(new Date(Date.now() - 1000), 1),
      };
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        pastReservation,
      );

      await expect(
        service.update(
          'test-reservation-id',
          'test-user-id',
          updateReservationDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a reservation successfully', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        ...mockReservationData,
        status: ReservationStatus.PENDING,
      });

      mockPrismaService.reservation.update.mockResolvedValue({
        ...mockReservationData,
        status: ReservationStatus.CANCELED,
      });

      const result = await service.cancel(
        'test-reservation-id',
        'test-user-id',
      );

      expect(mockPrismaService.reservation.update).toHaveBeenCalledWith({
        where: { reservation_id: 'test-reservation-id' },
        data: { status: ReservationStatus.CANCELED },
        include: {
          service: true,
          pet: true,
        },
      });

      expect(result).toHaveProperty('status', ReservationStatus.CANCELED);
    });

    it('should delete a blocked time when is_available is false', async () => {
      const blockedTime = {
        ...mockReservationData,
        is_available: false,
        business_id: 'test-user-id', // 사용자가 비즈니스 소유자
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(blockedTime);
      mockPrismaService.reservation.delete.mockResolvedValue(blockedTime);

      const result = await service.cancel(
        'test-reservation-id',
        'test-user-id',
      );

      expect(mockPrismaService.reservation.delete).toHaveBeenCalledWith({
        where: { reservation_id: 'test-reservation-id' },
      });

      expect(result).toEqual({
        success: true,
        message: '차단 시간이 삭제되었습니다.',
      });
    });

    it('should throw BadRequestException if reservation is not in PENDING status', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        ...mockReservationData,
        status: ReservationStatus.CONFIRMED,
      });

      await expect(
        service.cancel('test-reservation-id', 'test-user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserPets', () => {
    it('should return user pets', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: '테스트 사용자',
        pets: [mockPetData],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserPets('test-user-id');
      expect(result).toEqual(mockUser.pets);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        include: { pets: true },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserPets('invalid-id')).rejects.toThrow(
        NotFoundException,
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

      mockPrismaService.service.findMany.mockResolvedValue(mockServices);

      const result = await service.getAllServices();
      expect(result).toEqual(mockServices);
    });
  });
});
