import { SupabaseModule } from '@/auth/supabase/supabase.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { PetsController } from './pets/pets.controller';
import { PetsService } from './pets/pets.service';
import { ReservationsController } from './reservations/reservations.controller';
import { ReservationsService } from './reservations/reservations.service';
import { NotificationsModule } from '@/notifications/notifications.module';
import { SupabaseService } from '@/auth/supabase/supabase.service';

@Module({
  imports: [PrismaModule, SupabaseModule, NotificationsModule],
  controllers: [UsersController, PetsController, ReservationsController],
  providers: [UsersService, PetsService, ReservationsService, SupabaseService],
  exports: [UsersService],
})
export class UserModule {}
