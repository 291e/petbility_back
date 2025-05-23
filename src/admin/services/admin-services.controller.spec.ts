import { Test, TestingModule } from '@nestjs/testing';
import { AdminServicesController } from './admin-services.controller';
import { AdminServicesService } from './admin-services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceCategory } from '@prisma/client';
import { AuthGuard } from '@/auth/auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

describe('AdminServicesController', () => {
  let controller: AdminServicesController;
  let service: AdminServicesService;

  const mockServiceData = {
    service_id: 'test-service-id',
    name: '강아지 목욕',
    description: '반려견 목욕 서비스입니다.',
    price: 30000,
    category: ServiceCategory.grooming,
    admin_id: 'test-admin-id',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUser = {
    id: 'test-admin-id',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const mockAdminServicesService = {
    create: jest.fn().mockResolvedValue(mockServiceData),
    findAll: jest.fn().mockResolvedValue([mockServiceData]),
    findOne: jest.fn().mockResolvedValue(mockServiceData),
    update: jest.fn().mockResolvedValue(mockServiceData),
    remove: jest.fn().mockResolvedValue(mockServiceData),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminServicesController],
      providers: [
        {
          provide: AdminServicesService,
          useValue: mockAdminServicesService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<AdminServicesController>(AdminServicesController);
    service = module.get<AdminServicesService>(AdminServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a service', async () => {
      const createServiceDto: CreateServiceDto = {
        name: '강아지 목욕',
        description: '반려견 목욕 서비스입니다.',
        price: 30000,
        category: ServiceCategory.grooming,
      };

      const req = {
        user: mockUser,
        get: jest.fn(),
        header: jest.fn(),
        accepts: jest.fn(),
        acceptsCharsets: jest.fn(),
        acceptsEncodings: jest.fn(),
        acceptsLanguages: jest.fn(),
        range: jest.fn(),
      } as unknown as Request;

      const result = await controller.create(createServiceDto, req);

      expect(result).toEqual(mockServiceData);
      expect(service.create).toHaveBeenCalledWith(
        createServiceDto,
        mockUser.id,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of services', async () => {
      const result = await controller.findAll();

      expect(result).toEqual([mockServiceData]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      const result = await controller.findOne('test-service-id');

      expect(result).toEqual(mockServiceData);
      expect(service.findOne).toHaveBeenCalledWith('test-service-id');
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const updateServiceDto: UpdateServiceDto = {
        name: '프리미엄 강아지 목욕',
        price: 35000,
      };

      const result = await controller.update(
        'test-service-id',
        updateServiceDto,
      );

      expect(result).toEqual(mockServiceData);
      expect(service.update).toHaveBeenCalledWith(
        'test-service-id',
        updateServiceDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a service', async () => {
      const result = await controller.remove('test-service-id');

      expect(result).toEqual(mockServiceData);
      expect(service.remove).toHaveBeenCalledWith('test-service-id');
    });
  });
});
