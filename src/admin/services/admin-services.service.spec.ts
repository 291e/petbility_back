import { Test, TestingModule } from '@nestjs/testing';
import { AdminServicesService } from './admin-services.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceCategory } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('AdminServicesService', () => {
  let service: AdminServicesService;
  let prismaService: PrismaService;

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

  const mockPrismaService = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminServicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminServicesService>(AdminServicesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createServiceDto: CreateServiceDto = {
      name: '강아지 목욕',
      description: '반려견 목욕 서비스입니다.',
      price: 30000,
      category: ServiceCategory.grooming,
    };

    it('should create a service successfully', async () => {
      mockPrismaService.service.create.mockResolvedValue(mockServiceData);

      const result = await service.create(createServiceDto, 'test-admin-id');

      expect(result).toEqual(mockServiceData);
      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: {
          ...createServiceDto,
          admin_id: 'test-admin-id',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of services', async () => {
      const mockServices = [mockServiceData];
      mockPrismaService.service.findMany.mockResolvedValue(mockServices);

      const result = await service.findAll();

      expect(result).toEqual(mockServices);
      expect(mockPrismaService.service.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);

      const result = await service.findOne('test-service-id');

      expect(result).toEqual(mockServiceData);
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { service_id: 'test-service-id' },
      });
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateServiceDto: UpdateServiceDto = {
      name: '프리미엄 강아지 목욕',
      price: 35000,
    };

    it('should update a service successfully', async () => {
      const updatedService = { ...mockServiceData, ...updateServiceDto };
      mockPrismaService.service.update.mockResolvedValue(updatedService);

      const result = await service.update('test-service-id', updateServiceDto);

      expect(result).toEqual(updatedService);
      expect(mockPrismaService.service.update).toHaveBeenCalledWith({
        where: { service_id: 'test-service-id' },
        data: updateServiceDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a service successfully', async () => {
      mockPrismaService.service.delete.mockResolvedValue(mockServiceData);

      const result = await service.remove('test-service-id');

      expect(result).toEqual(mockServiceData);
      expect(mockPrismaService.service.delete).toHaveBeenCalledWith({
        where: { service_id: 'test-service-id' },
      });
    });
  });
});
