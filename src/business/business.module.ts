import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { BusinessReservationsController } from './reservations/business-reservations.controller';
import { BusinessReservationsService } from './reservations/business-reservations.service';
// import { BusinessStatisticsController } from './statistics/business-statistics.controller';
// import { BusinessStatisticsService } from './statistics/business-statistics.service';
import { NotificationsModule } from '@/notifications/notifications.module';
import { BusinessScheduleController } from './schedule/business-schedule.controller';
import { BusinessScheduleService } from './schedule/business-schedule.service';
import { AuthModule } from '@/auth/auth.module';
import { AuthGuard } from '@/auth/auth.guard';

/**
 * 주의: 현재 예약 관련 기능이 다음과 같이 중복되어 있습니다:
 * 1. BusinessReservationsController/Service: 예약 관리 + 영업 시간 관리
 * 2. BusinessScheduleController/Service: 영업 시간 관리
 *
 * TODO: 두 모듈의 책임을 명확히 분리해야 합니다:
 * - BusinessReservations: 예약 관리만 담당
 * - BusinessSchedule: 영업 시간/스케줄 관리만 담당
 */
@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [
    BusinessReservationsController,
    BusinessScheduleController, // 스케줄 컨트롤러 등록
  ],
  providers: [
    BusinessReservationsService,
    BusinessScheduleService,
    AuthGuard, // 스케줄 서비스 등록
  ],
})
export class BusinessModule {}
