import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

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
    this.logger.debug(`Getting user by token: ${token.substring(0, 10)}...`);

    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        this.logger.error(`Error getting user: ${error.message}`);
        return null;
      }

      this.logger.debug(`User found: ${data.user?.id}`);
      return data.user;
    } catch (error) {
      this.logger.error(`Exception getting user: ${error.message}`);
      return null;
    }
  }
}
