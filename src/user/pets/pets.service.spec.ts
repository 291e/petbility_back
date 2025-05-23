import { Test, TestingModule } from '@nestjs/testing';
import { PetsService } from './pets.service';
import { PrismaService } from 'prisma/prisma.service';
import { BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { CreatePetDto, PetGender } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Prisma } from '@prisma/client';

describe('PetsService', () => {
  let service: PetsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    pet: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    reservation: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        Logger,
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPet', () => {
    const mockUserId = 'test-user-id';
    const mockPetData: CreatePetDto = {
      name: '멍멍이',
      species: '강아지',
      breed: '말티즈',
      gender: PetGender.MALE,
      weight: 5.5,
      profileImageUrl: 'https://example.com/pet.jpg',
      note: '알러지가 있음',
    };

    it('should create a pet successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
      });
      mockPrismaService.pet.create.mockResolvedValue({
        ...mockPetData,
        pet_id: 'test-pet-id',
        user_id: mockUserId,
      });

      const result = await service.createPet(mockUserId, mockPetData);

      expect(result).toHaveProperty('pet_id');
      expect(result.user_id).toBe(mockUserId);
      expect(mockPrismaService.pet.create).toHaveBeenCalledWith({
        data: {
          ...mockPetData,
          user: {
            connect: { id: mockUserId },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createPet(mockUserId, mockPetData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.pet.create).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
      });
      mockPrismaService.pet.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '2.0.0',
        }),
      );

      await expect(service.createPet(mockUserId, mockPetData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserPets', () => {
    const mockUserId = 'test-user-id';
    const mockPets = [
      {
        pet_id: 'pet-1',
        name: '멍멍이',
        user_id: mockUserId,
        weight: 5.5,
        profileImageUrl: 'https://example.com/pet1.jpg',
      },
      {
        pet_id: 'pet-2',
        name: '냥냥이',
        user_id: mockUserId,
        weight: 4.0,
        profileImageUrl: 'https://example.com/pet2.jpg',
      },
    ];

    it('should return user pets', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
      });
      mockPrismaService.pet.findMany.mockResolvedValue(mockPets);

      const result = await service.getUserPets(mockUserId);

      expect(result).toEqual(mockPets);
      expect(mockPrismaService.pet.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserPets(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.pet.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getPetById', () => {
    const mockPetId = 'test-pet-id';
    const mockPet = {
      pet_id: mockPetId,
      name: '멍멍이',
      user_id: 'test-user-id',
      weight: 5.5,
      profileImageUrl: 'https://example.com/pet.jpg',
    };

    it('should return pet by id', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);

      const result = await service.getPetById(mockPetId);

      expect(result).toEqual(mockPet);
      expect(mockPrismaService.pet.findUnique).toHaveBeenCalledWith({
        where: { pet_id: mockPetId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if pet not found', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(null);

      await expect(service.getPetById(mockPetId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePet', () => {
    const mockPetId = 'test-pet-id';
    const mockUserId = 'test-user-id';
    const mockUpdateData: UpdatePetDto = {
      name: '멍멍이2',
      weight: 6.0,
      profileImageUrl: 'https://example.com/updated-pet.jpg',
      note: '업데이트된 특이사항',
    };

    it('should update pet successfully', async () => {
      mockPrismaService.pet.findFirst.mockResolvedValue({
        pet_id: mockPetId,
        user_id: mockUserId,
      });
      mockPrismaService.pet.update.mockResolvedValue({
        pet_id: mockPetId,
        ...mockUpdateData,
      });

      const result = await service.updatePet(
        mockPetId,
        mockUpdateData,
        mockUserId,
      );

      expect(result).toHaveProperty('pet_id', mockPetId);
      expect(result).toHaveProperty('weight', mockUpdateData.weight);
      expect(result).toHaveProperty(
        'profileImageUrl',
        mockUpdateData.profileImageUrl,
      );
      expect(mockPrismaService.pet.update).toHaveBeenCalledWith({
        where: { pet_id: mockPetId },
        data: mockUpdateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if pet not found or user not authorized', async () => {
      mockPrismaService.pet.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePet(mockPetId, mockUpdateData, mockUserId),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.pet.update).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors', async () => {
      mockPrismaService.pet.findFirst.mockResolvedValue({
        pet_id: mockPetId,
        user_id: mockUserId,
      });
      mockPrismaService.pet.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '2.0.0',
        }),
      );

      await expect(
        service.updatePet(mockPetId, mockUpdateData, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deletePet', () => {
    const mockPetId = 'test-pet-id';
    const mockUserId = 'test-user-id';

    it('should delete pet successfully', async () => {
      mockPrismaService.pet.findFirst.mockResolvedValue({
        pet_id: mockPetId,
        user_id: mockUserId,
      });
      mockPrismaService.$transaction.mockResolvedValue([]);

      const result = await service.deletePet(mockPetId, mockUserId);

      expect(result).toEqual({
        message: '반려동물이 성공적으로 삭제되었습니다.',
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if pet not found or user not authorized', async () => {
      mockPrismaService.pet.findFirst.mockResolvedValue(null);

      await expect(service.deletePet(mockPetId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors', async () => {
      mockPrismaService.pet.findFirst.mockResolvedValue({
        pet_id: mockPetId,
        user_id: mockUserId,
      });
      mockPrismaService.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: '2.0.0',
        }),
      );

      await expect(service.deletePet(mockPetId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
