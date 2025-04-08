import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { SupabaseModule } from '@/auth/supabase/supabase.module';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { EmailModule } from './email.module';

@Module({
  imports: [PrismaModule, SupabaseModule, EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SupabaseAuthGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
