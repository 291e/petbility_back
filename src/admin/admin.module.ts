import { Module } from '@nestjs/common';
// import { AdminStatisticsController } from './statistics/admin-statistics.controller';
// import { AdminStatisticsService } from './statistics/admin-statistics.service';
import { PrismaModule } from 'prisma/prisma.module';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AuthModule } from '@/auth/auth.module';
import { AdminServicesController } from './services/admin-services.controller';
import { AdminServicesService } from './services/admin-services.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminUsersController, AdminServicesController],
  providers: [AdminUsersService, AdminServicesService],
})
export class AdminModule {}
