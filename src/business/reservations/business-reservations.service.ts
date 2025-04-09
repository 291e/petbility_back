// src/business/reservations/business-reservations.service.ts

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { Prisma, ScheduleType, ReservationStatus } from '@prisma/client';
import {
  getDayOfWeek,
  getTimeOnly,
  generateTimeSlots,
} from '@/utils/datetime.util';
import { ManageAvailableTimeDto } from './dto/manage-available-time.dto';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationType } from '@/notifications/types/notification.type';
import { format } from 'date-fns';

@Injectable()
export class BusinessReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(business_id: string) {
    return this.prisma.reservation.findMany({
      where: { business_id },
      include: {
        user: {
          select: { user_id: true, name: true, phone: true, address: true },
        },
        pet: true,
        service: true,
      },
      orderBy: { reserved_at: 'desc' },
    });
  }

  async findOne(reservation_id: string, business_id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id },
      include: {
        user: true,
        pet: true,
        service: true,
      },
    });

    if (!reservation) throw new NotFoundException('예약을 찾을 수 없습니다.');
    if (reservation.business_id !== business_id)
      throw new ForbiddenException('본인에게 할당된 예약이 아닙니다.');

    return reservation;
  }

  async updateStatus(
    reservation_id: string,
    business_id: string,
    dto: UpdateReservationStatusDto,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id },
      include: {
        user: true,
        service: true,
        pet: true,
      },
    });

    if (!reservation) throw new NotFoundException('예약을 찾을 수 없습니다.');
    if (reservation.business_id !== business_id)
      throw new ForbiddenException('예약 변경 권한이 없습니다.');

    const updatedReservation = await this.prisma.reservation.update({
      where: { reservation_id },
      data: { status: dto.status },
      include: {
        user: true,
        service: true,
        pet: true,
      },
    });

    // 예약 상태 변경에 따른 알림 발송
    await this.sendStatusChangeNotification(updatedReservation);

    return updatedReservation;
  }

  // 예약 상태 변경 알림 발송
  private async sendStatusChangeNotification(reservation: any) {
    const formattedDate = format(
      reservation.reserved_at,
      'yyyy년 MM월 dd일 HH:mm',
    );
    let notificationType: NotificationType;
    let title: string;
    let message: string;

    switch (reservation.status) {
      case ReservationStatus.CONFIRMED:
        notificationType = NotificationType.RESERVATION_ACCEPTED;
        title = '예약이 승인되었습니다';
        message = '예약이 승인되었습니다.';
        break;
      case ReservationStatus.REJECTED:
        notificationType = NotificationType.RESERVATION_REJECTED;
        title = '예약이 거절되었습니다';
        message = '예약이 거절되었습니다.';
        break;
      case ReservationStatus.CANCELED:
        notificationType = NotificationType.RESERVATION_CANCELED;
        title = '예약이 취소되었습니다';
        message = '예약이 취소되었습니다.';
        break;
      default:
        throw new BadRequestException('잘못된 예약 상태입니다.');
    }

    // 사용자에게 알림 발송
    await this.notificationsService.create(reservation.user_id, {
      type: notificationType,
      title,
      message,
      metadata: {
        reservation_id: reservation.reservation_id,
        service_id: reservation.service_id,
        pet_id: reservation.pet_id,
        reserved_at: reservation.reserved_at,
      },
    });
  }

  // 예약 가능 시간 관리
  async manageAvailableTime(
    business_id: string,
    dto: ManageAvailableTimeDto,
  ): Promise<void> {
    try {
      // 기존 주간 일정 삭제
      await this.prisma.businessAvailableTime.deleteMany({
        where: {
          business_id,
          type: ScheduleType.WEEKLY,
        },
      });

      // 새로운 주간 일정 생성
      await this.prisma.businessAvailableTime.createMany({
        data: dto.weekly_schedule.map((schedule) => ({
          business_id,
          type: ScheduleType.WEEKLY,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        })),
      });

      // 예외 일정이 있는 경우 처리
      if (dto.exception_dates && dto.exception_dates.length > 0) {
        // 기존 예외 일정 삭제
        await this.prisma.businessAvailableTime.deleteMany({
          where: {
            business_id,
            type: ScheduleType.EXCEPTION,
          },
        });

        // 새로운 예외 일정 생성
        await this.prisma.businessAvailableTime.createMany({
          data: dto.exception_dates.map((exception) => ({
            business_id,
            type: ScheduleType.EXCEPTION,
            day_of_week: exception.day_of_week,
            start_time: exception.start_time,
            end_time: exception.end_time,
            reason: exception.reason,
          })),
        });
      }
    } catch (error) {
      throw new BadRequestException('가능 시간 관리 중 오류가 발생했습니다.');
    }
  }

  // 예약 가능 시간 조회
  async getAvailableTime(business_id: string) {
    const weeklySchedules = await this.prisma.businessAvailableTime.findMany({
      where: {
        business_id,
        type: ScheduleType.WEEKLY,
      },
      orderBy: {
        day_of_week: 'asc',
      },
    });

    const exceptionSchedules = await this.prisma.businessAvailableTime.findMany(
      {
        where: {
          business_id,
          type: ScheduleType.EXCEPTION,
        },
        orderBy: {
          date: 'asc',
        },
      },
    );

    return {
      weekly_schedules: weeklySchedules,
      exception_schedules: exceptionSchedules,
    };
  }

  // 특정 날짜의 예약 가능 시간 조회
  async getAvailableTimeByDate(business_id: string, date: string) {
    const targetDate = new Date(date);
    const dayOfWeek = getDayOfWeek(targetDate);

    // 1. 주간 일정 조회
    const weeklySchedule = await this.prisma.businessAvailableTime.findFirst({
      where: {
        business_id,
        type: ScheduleType.WEEKLY,
        day_of_week: dayOfWeek,
      },
    });

    // 2. 예외 일정 조회
    const exceptionSchedule = await this.prisma.businessAvailableTime.findFirst(
      {
        where: {
          business_id,
          type: ScheduleType.EXCEPTION,
          date: targetDate,
        },
      },
    );

    // 3. 예약된 시간 조회
    const reservedTimes = await this.prisma.reservation.findMany({
      where: {
        business_id,
        reserved_at: {
          gte: new Date(date + 'T00:00:00Z'),
          lt: new Date(date + 'T23:59:59Z'),
        },
        status: {
          not: ReservationStatus.CANCELED,
        },
      },
      select: {
        reserved_at: true,
      },
    });

    // 4. 시간대 생성
    const timeSlots = generateTimeSlots(
      exceptionSchedule?.start_time || weeklySchedule?.start_time || '09:00',
      exceptionSchedule?.end_time || weeklySchedule?.end_time || '18:00',
    );

    // 5. 예약된 시간 제외
    const availableTimeSlots = timeSlots.filter((time) => {
      const timeDate = new Date(date + 'T' + time);
      return !reservedTimes.some(
        (reservation) =>
          getTimeOnly(reservation.reserved_at) === getTimeOnly(timeDate),
      );
    });

    return {
      date,
      available_time_slots: availableTimeSlots,
      weekly_schedule: weeklySchedule,
      exception_schedule: exceptionSchedule,
    };
  }
}
