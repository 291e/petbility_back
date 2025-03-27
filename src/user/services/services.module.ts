import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { SupabaseModule } from '@/auth/supabase/supabase.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
