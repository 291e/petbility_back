import { Module } from '@nestjs/common';
import { AdminStatisticsController } from './statistics/admin-statistics.controller';
import { AdminStatisticsService } from './statistics/admin-statistics.service';
import { PrismaModule } from 'prisma/prisma.module';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { SupabaseModule } from '@/auth/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [AdminStatisticsController, AdminUsersController],
  providers: [AdminStatisticsService, AdminUsersService],
})
export class AdminModule {}
