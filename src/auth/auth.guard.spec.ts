import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { PrismaService } from 'prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let prismaService: PrismaService;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    prismaService = module.get<PrismaService>(PrismaService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when route is public', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = createMockExecutionContext();

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when no authorization header', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockExecutionContext({
      headers: {},
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('No authorization header'),
    );
  });

  it('should throw UnauthorizedException when invalid token format', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockExecutionContext({
      headers: {
        authorization: 'Invalid',
      },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid token format'),
    );
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new jwt.JsonWebTokenError('Invalid token');
    });

    const context = createMockExecutionContext({
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid token'),
    );
  });

  it('should throw UnauthorizedException when token is expired', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new jwt.TokenExpiredError('Token expired', new Date());
    });

    const context = createMockExecutionContext({
      headers: {
        authorization: 'Bearer expired-token',
      },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token expired'),
    );
  });

  it('should throw UnauthorizedException when user not found', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ sub: 'user-id' }));
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

    process.env.NEXTAUTH_SECRET = 'test-secret';

    const context = createMockExecutionContext({
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication failed'),
    );
  });

  it('should allow access when token is valid and user exists', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ sub: 'user-id' }));

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'USER',
      name: 'Test User',
      phone: '01012345678',
      profileImage: 'profile.jpg',
      address: '서울시 강남구',
      createdAt: new Date(),
      latitude: 37.5665,
      longitude: 126.978,
    };

    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

    process.env.NEXTAUTH_SECRET = 'test-secret';

    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: null,
    };

    const context = createMockExecutionContext(mockRequest);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockRequest.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      name: mockUser.name,
      phone: mockUser.phone,
      profileImage: mockUser.profileImage,
      address: mockUser.address,
      createdAt: mockUser.createdAt,
      latitude: mockUser.latitude,
      longitude: mockUser.longitude,
    });
  });
});

function createMockExecutionContext(request = {}): ExecutionContext {
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };

  return mockContext as ExecutionContext;
}
