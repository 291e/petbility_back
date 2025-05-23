import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { PetsController } from './pets/pets.controller';
import { PetsService } from './pets/pets.service';
import { ReservationsController } from './reservations/reservations.controller';
import { ReservationsService } from './reservations/reservations.service';
import { NotificationsModule } from '@/notifications/notifications.module';
import { HttpModule } from '@nestjs/axios';
import { PaymentsModule } from './payments/payments.module';
import { AuthGuard } from '@/auth/auth.guard';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    HttpModule,
    PaymentsModule,
    AuthModule,
  ],
  controllers: [UsersController, PetsController, ReservationsController],
  providers: [UsersService, PetsService, ReservationsService, AuthGuard],
  exports: [UsersService],
})
export class UserModule {}
