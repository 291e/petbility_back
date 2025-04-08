import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { BusinessReservationsController } from './reservations/business-reservations.controller';
import { BusinessReservationsService } from './reservations/business-reservations.service';
// import { BusinessStatisticsController } from './statistics/business-statistics.controller';
// import { BusinessStatisticsService } from './statistics/business-statistics.service';
import { SupabaseModule } from '@/auth/supabase/supabase.module';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [PrismaModule, SupabaseModule, NotificationsModule],
  controllers: [BusinessReservationsController],
  providers: [BusinessReservationsService],
})
export class BusinessModule {}
