import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  async signUp(userData: any) {
    const supabaseUser = await this.supabaseService.signUpWithEmailPassword({
      ...userData,
    });

    if (!supabaseUser) {
      throw new Error('Supabase user creation failed');
    }

    return this.prisma.user.create({
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
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
    });
  }

  async updateUser(userId: string, data: any) {
    return this.prisma.user.update({
      where: { user_id: userId },
      data,
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { user_id: userId },
    });
  }
}
