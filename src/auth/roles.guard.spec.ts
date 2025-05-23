import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const context = createMockExecutionContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      {},
      {},
    ]);
  });

  it('should throw ForbiddenException when user is not present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const context = createMockExecutionContext({ user: null });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('사용자 정보가 없습니다.'),
    );
  });

  it('should throw ForbiddenException when user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const context = createMockExecutionContext({
      user: { role: 'USER' },
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('접근 권한이 없습니다.'),
    );
  });

  it('should allow access when user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['ADMIN', 'USER']);

    const context = createMockExecutionContext({
      user: { role: 'USER' },
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
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
