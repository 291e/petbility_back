import { Module } from '@nestjs/common';
import { UsersModule } from './user/users/users.module';
import { PrismaModule } from 'prisma/prisma.module';
import { PetsModule } from './user/pets/pets.module';
import { SupabaseModule } from './auth/supabase/supabase.module';
import { ServicesModule } from './user/services/services.module';
import { ReservationsModule } from './user/reservations/reservations.module';
import { BusinessModule } from './business/business.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PetsModule,
    SupabaseModule,
    ServicesModule,
    ReservationsModule,
    BusinessModule,
    NotificationsModule,
  ],
})
export class AppModule {}
