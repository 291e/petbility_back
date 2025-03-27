import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { BusinessServicesController } from './services/business-services.controller';
import { BusinessServicesService } from './services/business-services.service';
import { BusinessReservationsController } from './reservations/business-reservations.controller';
import { BusinessReservationsService } from './reservations/business-reservations.service';
import { BusinessStatisticsController } from './statistics/business-statistics.controller';
import { BusinessStatisticsService } from './statistics/business-statistics.service';
import { SupabaseModule } from '@/auth/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [
    BusinessServicesController,
    BusinessReservationsController,
    BusinessStatisticsController,
  ],
  providers: [
    BusinessServicesService,
    BusinessReservationsService,
    BusinessStatisticsService,
  ],
})
export class BusinessModule {}
