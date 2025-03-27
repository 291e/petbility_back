import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { SupabaseModule } from '@/auth/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [PetsController],
  providers: [PetsService],
})
export class PetsModule {}
