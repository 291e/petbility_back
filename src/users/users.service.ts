import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async signUp(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    profileImage?: string;
    address?: string;
    role: string;
  }) {
    // Supabase에서 회원가입 처리
    const supabaseUser = await this.supabaseService.signUpWithEmailPassword({
      ...userData,
      phone: userData.phone || '',
      address: userData.address || '',
    });

    if (!supabaseUser) {
      throw new Error('Supabase user creation failed');
    }

    // PostgreSQL(user 테이블)에 저장
    const user = await this.prisma.user.create({
      data: {
        user_id: supabaseUser.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || '',
        profileImage: userData.profileImage || '',
        address: userData.address || '',
        role: userData.role,
      },
    });

    return user;
  }
}
