import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '@/auth/supabase/supabase.service';
import { Request } from 'express';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.split(' ')[1]; // "Bearer <TOKEN>"에서 TOKEN 추출
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }
    // 1. Supabase에서 토큰으로 유저 정보 가져오기
    const supabaseUser = await this.supabaseService.getUserByToken(token);
    if (!supabaseUser) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 2. PostgreSQL에서 유저 정보 (role 포함) 조회
    const userFromDB = await this.prisma.user.findUnique({
      where: { user_id: supabaseUser.id },
      select: {
        user_id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!userFromDB) {
      throw new UnauthorizedException('User not found in database');
    }

    // 3. request.user에 Supabase + DB 정보 합쳐서 저장
    request.user = {
      ...supabaseUser,
      ...userFromDB,
      phone: supabaseUser.phone || userFromDB.phone || undefined,
    };
    return true;
  }
}
