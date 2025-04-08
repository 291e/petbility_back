// src/@types/express/index.d.ts
import { User } from '@supabase/supabase-js'; // 실제 user 타입 import 필요

declare global {
  namespace Express {
    interface Request {
      user: User & {
        user_id: string;
        email: string;
        role: string;
        name: string;
        phone?: string;
        latitude?: number | null;
        longitude?: number | null;
      };
    }
  }
}
