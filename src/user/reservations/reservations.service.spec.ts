import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationStatus } from '@prisma/client';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { addHours, addDays } from 'date-fns';

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
    reserved_at: addHours(new Date(), 25),
    status: ReservationStatus.PENDING,
    price: 30000,
    notes: '테스트 예약입니다.',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    pet: {
      findUnique: jest.fn(),
    },
    reservation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationsService = {
    create: jest.fn(),
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
      reserved_at: addHours(new Date(), 25).toISOString(),
      notes: '테스트 예약입니다.',
    };

    it('should create a reservation successfully', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPetData,
        user: { user_id: 'test-user-id' },
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
          reserved_at: expect.any(Date),
          status: ReservationStatus.PENDING,
          price: mockServiceData.price,
        },
      });
      expect(mockNotificationsService.create).toHaveBeenCalled();
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
        user: { user_id: differentUserId },
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
        reserved_at: pastDate.toISOString(),
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPetData,
        user: { user_id: 'test-user-id' },
      });

      await expect(
        service.create('test-user-id', pastReservationDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if duplicate reservation exists', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      mockPrismaService.pet.findUnique.mockResolvedValue({
        ...mockPetData,
        user: { user_id: 'test-user-id' },
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
          OR: [{ user_id: 'test-user-id' }, { business_id: 'test-user-id' }],
        },
        include: {
          service: true,
          pet: true,
        },
        orderBy: {
          reserved_at: 'desc',
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
        },
      });
    });

    it('should throw NotFoundException if reservation not found', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', 'test-user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user does not have permission', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservationData,
      );

      await expect(
        service.findOne('test-reservation-id', 'unauthorized-user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateReservationDto: UpdateReservationDto = {
      reserved_at: addHours(new Date(), 26).toISOString(),
      notes: '수정된 테스트 예약입니다.',
    };

    it('should update a reservation successfully', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservationData,
      );
      mockPrismaService.reservation.update.mockResolvedValue({
        ...mockReservationData,
        ...updateReservationDto,
      });

      const result = await service.update(
        'test-reservation-id',
        'test-user-id',
        updateReservationDto,
      );

      expect(result).toEqual({
        ...mockReservationData,
        ...updateReservationDto,
      });
      expect(mockPrismaService.reservation.update).toHaveBeenCalledWith({
        where: { reservation_id: 'test-reservation-id' },
        data: updateReservationDto,
      });
      expect(mockNotificationsService.create).toHaveBeenCalled();
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

    it('should throw BadRequestException if reservation time is in the past', async () => {
      const pastReservation = {
        ...mockReservationData,
        reserved_at: new Date(Date.now() - 1000),
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
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservationData,
      );
      mockPrismaService.reservation.update.mockResolvedValue({
        ...mockReservationData,
        status: ReservationStatus.CANCELED,
      });

      const result = await service.cancel(
        'test-reservation-id',
        'test-user-id',
      );

      expect(result.status).toBe(ReservationStatus.CANCELED);
      expect(mockPrismaService.reservation.update).toHaveBeenCalledWith({
        where: { reservation_id: 'test-reservation-id' },
        data: { status: ReservationStatus.CANCELED },
      });
      expect(mockNotificationsService.create).toHaveBeenCalled();
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
});
