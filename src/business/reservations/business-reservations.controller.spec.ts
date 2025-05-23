import { Test, TestingModule } from '@nestjs/testing';
import { BusinessReservationsController } from './business-reservations.controller';
import { BusinessReservationsService } from './business-reservations.service';
import { ReservationStatus } from '@prisma/client';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';

describe('BusinessReservationsController', () => {
  let controller: BusinessReservationsController;
  let service: BusinessReservationsService;

  const mockBusinessReservationsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    getBusinessServices: jest.fn(),
    updateServiceStatus: jest.fn(),
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
      .overrideGuard(AuthGuard)
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

  describe('getMyServices', () => {
    it('should return business services', async () => {
      const mockServices = [
        {
          service_id: 'service-1',
          name: 'Grooming',
          description: 'Pet grooming service',
          price: 50000,
          category: 'grooming',
          status: 'active',
        },
      ];

      mockBusinessReservationsService.getBusinessServices.mockResolvedValue(
        mockServices,
      );

      const mockRequest = {
        user: {
          id: 'user-1',
        },
      };

      const result = await controller.getMyServices(mockRequest);

      expect(result).toEqual(mockServices);
      expect(
        mockBusinessReservationsService.getBusinessServices,
      ).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateServiceStatus', () => {
    it('should update service status', async () => {
      const updateDto: UpdateServiceStatusDto = {
        status: 'active',
      };

      const mockUpdatedService = {
        id: '1',
        business_id: 'business-1',
        service_id: 'service-1',
        is_active: true,
      };

      mockBusinessReservationsService.updateServiceStatus.mockResolvedValue(
        mockUpdatedService,
      );

      const mockRequest = {
        user: {
          id: 'user-1',
        },
      };

      const result = await controller.updateServiceStatus(
        mockRequest,
        'service-1',
        updateDto,
      );

      expect(result).toEqual(mockUpdatedService);
      expect(
        mockBusinessReservationsService.updateServiceStatus,
      ).toHaveBeenCalledWith('user-1', 'service-1', 'active');
    });
  });
});
