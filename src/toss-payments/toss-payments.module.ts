import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TossPaymentsService } from './toss-payments.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TossPaymentsService],
  exports: [TossPaymentsService],
})
export class TossPaymentsModule {}
