import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Role Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUpWithEmailPassword(userData: {
    email: string;
    password: string;
    name: string;
    phone: string;
    profileImage?: string;
    address: string;
    role: string;
  }) {
    const { email, password, name, phone, profileImage, address, role } =
      userData;

    // Supabase에 회원가입 요청
    const { data: authData, error: authError } =
      await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, profileImage, address, role },
        },
      });

    if (authError) {
      throw new Error(authError.message);
    }

    return authData.user;
  }

  async getUserByToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) {
      return null;
    }
    return data.user;
  }
}
