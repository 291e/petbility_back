import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { SupabaseModule } from './auth/supabase/supabase.module';
import { BusinessModule } from './business/business.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
    BusinessModule,
    NotificationsModule,
    AdminModule,
    UserModule,
  ],
})
export class AppModule {}
