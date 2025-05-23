import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from 'prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '@/notifications/notifications.module';
import { TossPaymentsModule } from '@/toss-payments/toss-payments.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    NotificationsModule,
    TossPaymentsModule,
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
