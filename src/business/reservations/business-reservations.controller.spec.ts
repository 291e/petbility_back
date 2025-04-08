import { Test, TestingModule } from '@nestjs/testing';
import { BusinessReservationsController } from './business-reservations.controller';
import { BusinessReservationsService } from './business-reservations.service';
import { ReservationStatus } from '@prisma/client';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ManageAvailableTimeDto } from './dto/manage-available-time.dto';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';

describe('BusinessReservationsController', () => {
  let controller: BusinessReservationsController;
  let service: BusinessReservationsService;

  const mockBusinessReservationsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    manageAvailableTime: jest.fn(),
    getAvailableTime: jest.fn(),
    getAvailableTimeByDate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessReservationsController],
      providers: [
        {
          provide: BusinessReservationsService,
          useValue: mockBusinessReservationsService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BusinessReservationsController>(
      BusinessReservationsController,
    );
    service = module.get<BusinessReservationsService>(
      BusinessReservationsService,
    );
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
          user: { name: 'John' },
          pet: { name: 'Max' },
          service: { name: 'Grooming' },
        },
      ];

      mockBusinessReservationsService.findAll.mockResolvedValue(
        mockReservations,
      );

      const result = await controller.findAll('business-1');

      expect(result).toEqual(mockReservations);
      expect(mockBusinessReservationsService.findAll).toHaveBeenCalledWith(
        'business-1',
      );
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

      mockBusinessReservationsService.findOne.mockResolvedValue(
        mockReservation,
      );

      const result = await controller.findOne('1', 'business-1');

      expect(result).toEqual(mockReservation);
      expect(mockBusinessReservationsService.findOne).toHaveBeenCalledWith(
        '1',
        'business-1',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update reservation status', async () => {
      const updateDto: UpdateReservationStatusDto = {
        status: ReservationStatus.CONFIRMED,
      };

      const mockUpdatedReservation = {
        reservation_id: '1',
        business_id: 'business-1',
        status: ReservationStatus.CONFIRMED,
      };

      mockBusinessReservationsService.updateStatus.mockResolvedValue(
        mockUpdatedReservation,
      );

      const result = await controller.updateStatus(
        '1',
        'business-1',
        updateDto,
      );

      expect(result).toEqual(mockUpdatedReservation);
      expect(mockBusinessReservationsService.updateStatus).toHaveBeenCalledWith(
        '1',
        'business-1',
        updateDto,
      );
    });
  });

  describe('manageAvailableTime', () => {
    it('should manage available time slots', async () => {
      const manageTimeDto: ManageAvailableTimeDto = {
        weekly_schedule: [
          {
            day_of_week: 'MONDAY',
            start_time: '09:00',
            end_time: '18:00',
          },
        ],
      };

      const mockResponse = {
        weekly_schedule: [
          {
            id: '1',
            business_id: 'business-1',
            service_id: 'service-1',
            day_of_week: 'MONDAY',
            start_time: '09:00',
            end_time: '18:00',
          },
        ],
      };

      mockBusinessReservationsService.manageAvailableTime.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.manageAvailableTime(
        'business-1',
        'service-1',
        manageTimeDto,
      );

      expect(result).toEqual(mockResponse);
      expect(
        mockBusinessReservationsService.manageAvailableTime,
      ).toHaveBeenCalledWith('business-1', 'service-1', manageTimeDto);
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

      mockBusinessReservationsService.getAvailableTime.mockResolvedValue(
        mockAvailableTimes,
      );

      const result = await controller.getAvailableTime(
        'business-1',
        'service-1',
      );

      expect(result).toEqual(mockAvailableTimes);
      expect(
        mockBusinessReservationsService.getAvailableTime,
      ).toHaveBeenCalledWith('business-1', 'service-1');
    });
  });

  describe('getAvailableTimeByDate', () => {
    it('should return available time slots for a specific date', async () => {
      const mockDate = '2024-04-08';
      const mockTimeSlots = ['09:00', '10:00', '11:00'];

      mockBusinessReservationsService.getAvailableTimeByDate.mockResolvedValue(
        mockTimeSlots,
      );

      const result = await controller.getAvailableTimeByDate(
        'business-1',
        'service-1',
        mockDate,
      );

      expect(result).toEqual(mockTimeSlots);
      expect(
        mockBusinessReservationsService.getAvailableTimeByDate,
      ).toHaveBeenCalledWith('business-1', 'service-1', mockDate);
    });
  });
});
