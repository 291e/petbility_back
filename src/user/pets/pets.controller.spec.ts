import { Test, TestingModule } from '@nestjs/testing';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { PrismaService } from 'prisma/prisma.service';
import { AuthGuard } from '@/auth/auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { CreatePetDto, PetGender } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

describe('PetsController', () => {
  let controller: PetsController;
  let service: PetsService;

  const mockPetData = {
    pet_id: '1',
    name: 'Test Pet',
    species: '강아지',
    breed: '말티즈',
    birthDate: '2020-01-01',
    gender: PetGender.MALE,
    weight: 5.5,
    profileImageUrl: 'https://example.com/pet.jpg',
    note: '알러지가 있음',
    user_id: 'test-user-id',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'USER',
    name: 'Test User',
    phone: '1234567890',
    latitude: 37.5665,
    longitude: 126.978,
  };

  const mockPetsService = {
    createPet: jest.fn().mockResolvedValue(mockPetData),
    getUserPets: jest.fn().mockResolvedValue([mockPetData]),
    getPetById: jest.fn().mockResolvedValue(mockPetData),
    updatePet: jest.fn().mockResolvedValue(mockPetData),
    deletePet: jest
      .fn()
      .mockResolvedValue({ message: '반려동물이 성공적으로 삭제되었습니다.' }),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
    },
    pet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetsController],
      providers: [
        {
          provide: PetsService,
          useValue: mockPetsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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

    controller = module.get<PetsController>(PetsController);
    service = module.get<PetsService>(PetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPet', () => {
    it('should create a pet', async () => {
      const createPetDto: CreatePetDto = {
        name: 'Test Pet',
        species: '강아지',
        breed: '말티즈',
        birthDate: '2020-01-01',
        gender: PetGender.MALE,
        weight: 5.5,
        profileImageUrl: 'https://example.com/pet.jpg',
        note: '알러지가 있음',
      };

      const req = { user: { id: mockUser.id } };
      const result = await controller.createPet(req as any, createPetDto);
      expect(result).toEqual(mockPetData);
      expect(service.createPet).toHaveBeenCalledWith(mockUser.id, createPetDto);
    });
  });

  describe('getUserPets', () => {
    it('should return user pets', async () => {
      const req = { user: { id: mockUser.id } };
      const result = await controller.getUserPets(req as any);
      expect(result).toEqual([mockPetData]);
      expect(service.getUserPets).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getPetById', () => {
    it('should return pet by id', async () => {
      const result = await controller.getPetById('1');
      expect(result).toEqual(mockPetData);
      expect(service.getPetById).toHaveBeenCalledWith('1');
    });
  });

  describe('updatePet', () => {
    it('should update pet', async () => {
      const updatePetDto: UpdatePetDto = {
        name: 'Updated Pet',
        species: '강아지',
        breed: '말티즈',
        weight: 6.0,
        note: '업데이트된 알러지 정보',
      };

      const req = { user: { id: mockUser.id } };
      const result = await controller.updatePet(req as any, '1', updatePetDto);
      expect(result).toEqual(mockPetData);
      expect(service.updatePet).toHaveBeenCalledWith(
        '1',
        updatePetDto,
        mockUser.id,
      );
    });
  });

  describe('deletePet', () => {
    it('should delete pet', async () => {
      const req = { user: { id: mockUser.id } };
      const result = await controller.deletePet(req as any, '1');
      expect(result).toEqual({
        message: '반려동물이 성공적으로 삭제되었습니다.',
      });
      expect(service.deletePet).toHaveBeenCalledWith('1', mockUser.id);
    });
  });
});
