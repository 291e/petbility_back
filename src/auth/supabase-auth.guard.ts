import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Request } from 'express';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

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

    const user = await this.supabaseService.getUserByToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = user; // 요청 객체에 유저 정보 저장
    return true;
  }
}
