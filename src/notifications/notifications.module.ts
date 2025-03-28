import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { SupabaseModule } from '@/auth/supabase/supabase.module';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
