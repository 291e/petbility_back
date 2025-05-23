import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UserRole } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    reservation: {
      deleteMany: jest.fn(),
    },
    pet: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const mockUserData = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '01012345678',
      profileImage: 'profile.jpg',
      address: 'Test Address',
      role: UserRole.USER,
      latitude: 37.5665,
      longitude: 126.978,
    };

    it('should create a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUserData);

      const result = await service.signUp(mockUserData);

      expect(result).toEqual(mockUserData);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: mockUserData,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '2.0.0',
        },
      );
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.signUp(mockUserData)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    const mockUserId = 'test-user-id';
    const mockUser = {
      id: mockUserId,
      email: 'test@example.com',
      name: 'Test User',
      pets: [],
      services: [],
      reservations: [],
    };

    it('should return user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockUserId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: {
          pets: true,
          services: true,
          reservations: {
            include: {
              service: true,
              pet: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    const mockUserId = 'test-user-id';
    const mockUpdateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };
    const mockExistingUser = {
      id: mockUserId,
      email: 'test@example.com',
    };

    it('should update user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockExistingUser,
        ...mockUpdateData,
      });

      const result = await service.updateUser(mockUserId, mockUpdateData);

      expect(result).toEqual({
        ...mockExistingUser,
        ...mockUpdateData,
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: mockUpdateData,
        include: {
          pets: true,
          services: true,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUser(mockUserId, mockUpdateData),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if email is already in use', async () => {
      const anotherUser = {
        id: 'another-user-id',
        email: mockUpdateData.email,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockExistingUser);
      mockPrismaService.user.findFirst.mockResolvedValue(anotherUser);

      await expect(
        service.updateUser(mockUserId, mockUpdateData),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    const mockUserId = 'test-user-id';
    const mockUser = {
      id: mockUserId,
      role: UserRole.USER,
      pets: [],
      services: [],
      reservations: [],
    };

    it('should delete user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.$transaction.mockResolvedValue([]);

      const result = await service.deleteUser(mockUserId);

      expect(result).toEqual({
        message: '사용자가 성공적으로 삭제되었습니다.',
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if trying to delete business account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: UserRole.BUSINESS,
      });

      await expect(service.deleteUser(mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('upgradeToBusiness', () => {
    const mockUserId = 'test-user-id';
    const mockUser = {
      id: mockUserId,
      role: UserRole.USER,
    };

    it('should upgrade user to business successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        role: UserRole.BUSINESS,
      });

      const result = await service.upgradeToBusiness(mockUserId);

      expect(result.role).toBe(UserRole.BUSINESS);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { role: UserRole.BUSINESS },
        include: {
          pets: true,
          services: true,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.upgradeToBusiness(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is already a business account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: UserRole.BUSINESS,
      });

      await expect(service.upgradeToBusiness(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('searchUsers', () => {
    const mockQuery = 'test';
    const mockPage = 1;
    const mockLimit = 10;
    const mockUsers = [
      { id: 'user1', name: 'Test User 1' },
      { id: 'user2', name: 'Test User 2' },
    ];
    const mockTotal = 2;

    it('should return paginated search results', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(mockTotal);

      const result = await service.searchUsers(mockQuery, mockPage, mockLimit);

      expect(result).toEqual({
        users: mockUsers,
        total: mockTotal,
        page: mockPage,
        limit: mockLimit,
        totalPages: Math.ceil(mockTotal / mockLimit),
      });
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: mockQuery } },
            { email: { contains: mockQuery } },
            { phone: { contains: mockQuery } },
          ],
        },
        skip: 0,
        take: mockLimit,
        include: {
          pets: true,
          services: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: mockQuery } },
            { email: { contains: mockQuery } },
            { phone: { contains: mockQuery } },
          ],
        },
      });
    });
  });
});
