import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { SupabaseModule } from '@/auth/supabase/supabase.module';
import { PrismaModule } from 'prisma/prisma.module';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [PrismaModule, SupabaseModule, NotificationsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
