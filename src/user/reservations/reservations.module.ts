import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { SupabaseModule } from '@/auth/supabase/supabase.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
