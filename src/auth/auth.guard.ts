import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import * as jwt from 'jsonwebtoken';

// 사용자 정보 인터페이스 정의
interface UserPayload {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  image?: string | null;
  address?: string | null;
  role: string;
  createdAt: Date;
  latitude?: number | null;
  longitude?: number | null;
}

// Request 타입 확장
declare global {
  namespace Express {
    interface User extends UserPayload {}
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public 데코레이터가 적용된 경우 인증 건너뛰기
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.split(' ')[1]; // "Bearer <TOKEN>"에서 TOKEN 추출
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      // JWT 토큰 검증
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) {
        throw new Error('NEXTAUTH_SECRET is not defined');
      }

      const decoded = jwt.verify(token, secret);

      // 토큰에서 사용자 ID 추출
      const userId = decoded.sub;

      if (!userId || typeof userId !== 'string') {
        throw new UnauthorizedException('Invalid token payload');
      }

      // DB에서 사용자 정보 조회
      const userFromDB = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
          image: true,
          address: true,
          createdAt: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!userFromDB) {
        throw new UnauthorizedException('User not found in database');
      }

      // request.user에 사용자 정보 저장
      request.user = {
        id: userFromDB.id,
        email: userFromDB.email || '',
        role: userFromDB.role,
        name: userFromDB.name || '',
        phone: userFromDB.phone,
        image: userFromDB.image,
        address: userFromDB.address,
        createdAt: userFromDB.createdAt,
        latitude: userFromDB.latitude,
        longitude: userFromDB.longitude,
      };

      return true;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
