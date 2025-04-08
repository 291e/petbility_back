import { Test, TestingModule } from '@nestjs/testing';
import { BusinessReservationsService } from './business-reservations.service';
import { PrismaService } from 'prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus, ScheduleType } from '@prisma/client';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ManageAvailableTimeDto } from './dto/manage-available-time.dto';

describe('BusinessReservationsService', () => {
  let service: BusinessReservationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    reservation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    businessAvailableTime: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessReservationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BusinessReservationsService>(
      BusinessReservationsService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all reservations for a business', async () => {
      const mockReservations = [
        {
          reservation_id: '1',
          business_id: 'business-1',
          user: {
            user_id: 'user-1',
            name: 'John',
            phone: '1234',
            address: 'Seoul',
          },
          pet: { name: 'Max' },
          service: { name: 'Grooming' },
        },
      ];

      mockPrismaService.reservation.findMany.mockResolvedValue(
        mockReservations,
      );

      const result = await service.findAll('business-1');

      expect(result).toEqual(mockReservations);
      expect(mockPrismaService.reservation.findMany).toHaveBeenCalledWith({
        where: { business_id: 'business-1' },
        include: {
          user: {
            select: { user_id: true, name: true, phone: true, address: true },
          },
          pet: true,
          service: true,
        },
        orderBy: { reserved_at: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a specific reservation', async () => {
      const mockReservation = {
        reservation_id: '1',
        business_id: 'business-1',
        user: { name: 'John' },
        pet: { name: 'Max' },
        service: { name: 'Grooming' },
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      const result = await service.findOne('1', 'business-1');

      expect(result).toEqual(mockReservation);
      expect(mockPrismaService.reservation.findUnique).toHaveBeenCalledWith({
        where: { reservation_id: '1' },
        include: {
          user: true,
          pet: true,
          service: true,
        },
      });
    });

    it('should throw NotFoundException when reservation not found', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1', 'business-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when reservation belongs to different business', async () => {
      const mockReservation = {
        reservation_id: '1',
        business_id: 'different-business',
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      await expect(service.findOne('1', 'business-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus', () => {
    const mockReservation = {
      reservation_id: '1',
      business_id: 'business-1',
    };

    const updateDto: UpdateReservationStatusDto = {
      status: ReservationStatus.CONFIRMED,
    };

    it('should update reservation status', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );
      mockPrismaService.reservation.update.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      });

      const result = await service.updateStatus('1', 'business-1', updateDto);

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
      expect(mockPrismaService.reservation.update).toHaveBeenCalledWith({
        where: { reservation_id: '1' },
        data: { status: ReservationStatus.CONFIRMED },
      });
    });

    it('should throw NotFoundException when reservation not found', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('1', 'business-1', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when reservation belongs to different business', async () => {
      const differentBusinessReservation = {
        reservation_id: '1',
        business_id: 'different-business',
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        differentBusinessReservation,
      );

      await expect(
        service.updateStatus('1', 'business-1', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAvailableTime', () => {
    it('should return available time slots', async () => {
      const mockAvailableTimes = [
        {
          id: '1',
          business_id: 'business-1',
          service_id: 'service-1',
          day_of_week: 'MONDAY',
          start_time: '09:00',
          end_time: '18:00',
        },
      ];

      mockPrismaService.businessAvailableTime.findMany.mockResolvedValue(
        mockAvailableTimes,
      );

      const result = await service.getAvailableTime('business-1', 'service-1');

      expect(result).toEqual(mockAvailableTimes);
      expect(
        mockPrismaService.businessAvailableTime.findMany,
      ).toHaveBeenCalledWith({
        where: {
          business_id: 'business-1',
          service_id: 'service-1',
        },
        orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
      });
    });

    it('should handle errors gracefully', async () => {
      mockPrismaService.businessAvailableTime.findMany.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '2.0.0',
        }),
      );

      await expect(
        service.getAvailableTime('business-1', 'service-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableTimeByDate', () => {
    const mockDate = '2024-04-08';
    const mockServiceId = 'service-1';
    const mockBusinessId = 'business-1';

    it('should return exception schedule if it exists', async () => {
      const mockExceptionSchedule = {
        id: '1',
        type: ScheduleType.EXCEPTION,
        start_time: '09:00',
        end_time: '18:00',
      };

      mockPrismaService.businessAvailableTime.findFirst.mockResolvedValueOnce(
        mockExceptionSchedule,
      );

      const result = await service.getAvailableTimeByDate(
        mockBusinessId,
        mockServiceId,
        mockDate,
      );

      expect(result).toBeDefined();
      expect(
        mockPrismaService.businessAvailableTime.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          business_id: mockBusinessId,
          service_id: mockServiceId,
          type: ScheduleType.EXCEPTION,
          date: expect.any(Date),
        },
      });
    });

    it('should return weekly schedule if no exception exists', async () => {
      mockPrismaService.businessAvailableTime.findFirst
        .mockResolvedValueOnce(null) // No exception schedule
        .mockResolvedValueOnce({
          // Weekly schedule
          start_time: '09:00',
          end_time: '18:00',
        });

      mockPrismaService.reservation.findMany.mockResolvedValue([]); // No existing reservations

      const result = await service.getAvailableTimeByDate(
        mockBusinessId,
        mockServiceId,
        mockDate,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockPrismaService.businessAvailableTime.findFirst.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '2.0.0',
        }),
      );

      await expect(
        service.getAvailableTimeByDate(mockBusinessId, mockServiceId, mockDate),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
