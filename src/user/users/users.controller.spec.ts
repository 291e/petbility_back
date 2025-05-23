import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './dto/create-user.dto';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@/auth/auth.guard';
import { Request } from 'express';

// Request 타입의 모의 객체를 생성하는 헬퍼 함수
function createMockRequest(user: any): Request {
  return {
    user,
  } as Request;
}

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    updateUser: jest.fn(),
    upgradeToBusiness: jest.fn(),
    deleteUser: jest.fn(),
    searchUsers: jest.fn(),
    signUp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should return user profile', async () => {
      const userId = '123';
      const mockUser = { id: userId, email: 'test@test.com' };
      const mockRequest = createMockRequest({ id: userId });

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.getMyProfile(mockRequest);
      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
    });
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

    it('should create a new user', async () => {
      mockUsersService.signUp.mockResolvedValue(mockUserData);

      const result = await controller.signUp(mockUserData);

      expect(result).toEqual(mockUserData);
      expect(mockUsersService.signUp).toHaveBeenCalledWith(mockUserData);
    });

    it('should handle signup errors', async () => {
      mockUsersService.signUp.mockRejectedValue(
        new BadRequestException('이미 존재하는 사용자입니다.'),
      );

      await expect(controller.signUp(mockUserData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateMe', () => {
    const mockUserId = 'test-user-id';
    const mockUpdateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };
    const mockUpdatedUser = {
      id: mockUserId,
      ...mockUpdateData,
    };

    it('should update current user information', async () => {
      const mockRequest = createMockRequest({ id: mockUserId });
      mockUsersService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateMe(mockRequest, mockUpdateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        mockUserId,
        mockUpdateData,
      );
    });

    it('should handle update errors', async () => {
      const mockRequest = createMockRequest({ id: mockUserId });
      mockUsersService.updateUser.mockRejectedValue(
        new BadRequestException('이미 사용 중인 이메일입니다.'),
      );

      await expect(
        controller.updateMe(mockRequest, mockUpdateData),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMe', () => {
    const mockUserId = 'test-user-id';
    const mockDeleteResult = { message: '사용자가 성공적으로 삭제되었습니다.' };

    it('should delete current user', async () => {
      const mockRequest = createMockRequest({ id: mockUserId });
      mockUsersService.deleteUser.mockResolvedValue(mockDeleteResult);

      const result = await controller.deleteMe(mockRequest);

      expect(result).toEqual(mockDeleteResult);
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle delete errors', async () => {
      const mockRequest = createMockRequest({ id: mockUserId });
      mockUsersService.deleteUser.mockRejectedValue(
        new ForbiddenException('사업자 계정은 삭제할 수 없습니다.'),
      );

      await expect(controller.deleteMe(mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('upgradeToBusiness', () => {
    const mockUserId = 'test-user-id';
    const mockUpgradedUser = {
      id: mockUserId,
      role: UserRole.BUSINESS,
    };

    it('should upgrade user to business account', async () => {
      const mockRequest = createMockRequest({ id: mockUserId });
      mockUsersService.upgradeToBusiness.mockResolvedValue(mockUpgradedUser);

      const result = await controller.upgradeToBusiness(mockRequest);

      expect(result).toEqual(mockUpgradedUser);
      expect(mockUsersService.upgradeToBusiness).toHaveBeenCalledWith(
        mockUserId,
      );
    });

    it('should handle upgrade errors', async () => {
      const mockRequest = createMockRequest({ id: mockUserId });
      mockUsersService.upgradeToBusiness.mockRejectedValue(
        new BadRequestException('이미 사업자 계정입니다.'),
      );

      await expect(controller.upgradeToBusiness(mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('searchUsers', () => {
    const mockQuery = 'test';
    const mockPage = '1';
    const mockLimit = '10';
    const mockSearchResult = {
      users: [
        { id: 'user1', name: 'Test User 1' },
        { id: 'user2', name: 'Test User 2' },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return search results', async () => {
      mockUsersService.searchUsers.mockResolvedValue(mockSearchResult);

      const result = await controller.searchUsers(
        mockQuery,
        mockPage,
        mockLimit,
      );

      expect(result).toEqual(mockSearchResult);
      expect(mockUsersService.searchUsers).toHaveBeenCalledWith(
        mockQuery,
        parseInt(mockPage),
        parseInt(mockLimit),
      );
    });

    it('should use default pagination values when not provided', async () => {
      mockUsersService.searchUsers.mockResolvedValue(mockSearchResult);

      const result = await controller.searchUsers(mockQuery);

      expect(result).toEqual(mockSearchResult);
      expect(mockUsersService.searchUsers).toHaveBeenCalledWith(
        mockQuery,
        1,
        10,
      );
    });

    it('should throw BadRequestException when query is empty', async () => {
      // 테스트 전 모킹 함수 초기화
      mockUsersService.searchUsers.mockClear();

      try {
        await controller.searchUsers('');
        // 이 부분에 도달하면 안됨
        fail('검색어가 비어있을 때 BadRequestException이 발생해야 합니다.');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('검색어를 입력해주세요.');
        expect(mockUsersService.searchUsers).not.toHaveBeenCalled();
      }
    });
  });
});
