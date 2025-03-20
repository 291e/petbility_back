import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from 'prisma/prisma.module';
import { PetsModule } from './pets/pets.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [UsersModule, PrismaModule, PetsModule, SupabaseModule],
})
export class AppModule {}
