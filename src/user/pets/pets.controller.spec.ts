import { Test, TestingModule } from '@nestjs/testing';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { PrismaService } from 'prisma/prisma.service';
import { SupabaseService } from '@/auth/supabase/supabase.service';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { CreatePetDto, PetGender } from './dto/create-pet.dto';

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
    note: '알러지가 있음',
    user_id: 'test-user-id',
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
    deletePet: jest.fn().mockResolvedValue(mockPetData),
  };

  const mockSupabaseService = {
    getUserByToken: jest.fn().mockResolvedValue(mockUser),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
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
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
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
        note: '알러지가 있음',
      };

      const req = { user: { user_id: mockUser.id } };
      const result = await controller.createPet(req, createPetDto);
      expect(result).toEqual(mockPetData);
      expect(service.createPet).toHaveBeenCalledWith(mockUser.id, createPetDto);
    });
  });

  describe('getUserPets', () => {
    it('should return user pets', async () => {
      const req = { user: { user_id: mockUser.id } };
      const result = await controller.getUserPets(req);
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
      const updatePetDto = {
        name: 'Updated Pet',
        species: '강아지',
        breed: '말티즈',
      };

      const req = { user: { user_id: mockUser.id } };
      const result = await controller.updatePet(req, '1', updatePetDto);
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
      const req = { user: { user_id: mockUser.id } };
      const result = await controller.deletePet(req, '1');
      expect(result).toEqual(mockPetData);
      expect(service.deletePet).toHaveBeenCalledWith('1', mockUser.id);
    });
  });
});
