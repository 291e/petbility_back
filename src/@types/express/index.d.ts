// src/@types/express/index.d.ts
import { User } from '@supabase/supabase-js'; // 실제 user 타입 import 필요

declare global {
  namespace Express {
    interface Request {
      user: User; // 여기에 실제 유저 타입을 넣어줘
    }
  }
}
