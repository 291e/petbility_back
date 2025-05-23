// src/@types/express/index.d.ts
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: User & {
        id: string;
        email: string;
        name: string;
        phone?: string | null;
        profileImage?: string | null;
        address?: string | null;
        role: string;
        createdAt: Date;
        latitude?: number | null;
        longitude?: number | null;
      };
    }
  }
}
