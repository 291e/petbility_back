import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { getDistanceInKm } from '@/utils/distance.util';
import {
  addHours,
  addMinutes,
  isBefore,
  isAfter,
  addDays,
  subDays,
  format,
} from 'date-fns';
import {
  generateTimeSlots,
  getDayOfWeek,
  getTimeOnly,
} from '@/utils/datetime.util';
import { Prisma, ReservationStatus, ScheduleType } from '@prisma/client';
import { NotificationsService } from '@/notifications/notifications.service';
import { format as formatDate, parseISO } from 'date-fns';
import { NotificationType } from '@/notifications/types/notification.type';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async validateReservationTime(reservedAt: Date): Promise<void> {
    const now = new Date();
    const minReservationTime = addHours(now, 24); // 24시간 후부터 예약 가능
    const maxReservationTime = addDays(now, 30); // 30일 후까지만 예약 가능

    if (isBefore(reservedAt, minReservationTime)) {
      throw new BadRequestException('예약은 24시간 후부터 가능합니다.');
    }

    if (isAfter(reservedAt, maxReservationTime)) {
      throw new BadRequestException('예약은 30일 후까지만 가능합니다.');
    }
  }

  private async validateDuplicateReservation(
    service_id: string,
    reservedAt: Date,
  ): Promise<void> {
    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        service_id,
        reserved_at: reservedAt,
        status: {
          notIn: ['CANCELED', 'REJECTED'],
        },
      },
    });

    if (existingReservation) {
      throw new BadRequestException('해당 시간에 이미 예약이 있습니다.');
    }
  }

  async create(user_id: string, createReservationDto: CreateReservationDto) {
    const { service_id, pet_id, reserved_at } = createReservationDto;

    // 1. 서비스 존재 여부 확인
    const service = await this.prisma.service.findUnique({
      where: { service_id },
    });

    if (!service) {
      throw new NotFoundException('서비스를 찾을 수 없습니다.');
    }

    // 2. 반려동물 존재 여부 및 소유자 확인
    const pet = await this.prisma.pet.findUnique({
      where: { pet_id },
      include: { user: true },
    });

    if (!pet) {
      throw new NotFoundException('반려동물을 찾을 수 없습니다.');
    }

    if (pet.user_id !== user_id) {
      throw new BadRequestException('해당 반려동물에 대한 권한이 없습니다.');
    }

    // 3. 예약 시간 유효성 검사
    const reservationTime = parseISO(reserved_at);
    if (isBefore(reservationTime, new Date())) {
      throw new BadRequestException('과거 시간으로는 예약할 수 없습니다.');
    }

    // 4. 중복 예약 확인
    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        service_id,
        reserved_at: reservationTime,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
    });

    if (existingReservation) {
      throw new BadRequestException('해당 시간에 이미 예약이 있습니다.');
    }

    // 5. 예약 생성
    const reservation = await this.prisma.reservation.create({
      data: {
        user_id,
        service_id,
        pet_id,
        business_id: service.admin_id,
        reserved_at: reservationTime,
        status: ReservationStatus.PENDING,
        price: service.price,
      },
    });

    // 6. 알림 생성
    await this.notificationsService.create(user_id, {
      type: NotificationType.RESERVATION_CREATED,
      title: '예약이 생성되었습니다',
      message: `${format(reservationTime, 'yyyy년 MM월 dd일 HH:mm')}에 예약이 생성되었습니다.`,
      metadata: {
        reservation_id: reservation.reservation_id,
      },
    });

    return reservation;
  }

  async findAll(user_id: string) {
    return this.prisma.reservation.findMany({
      where: {
        OR: [{ user_id }, { business_id: user_id }],
      },
      include: {
        service: true,
        pet: true,
      },
      orderBy: {
        reserved_at: 'desc',
      },
    });
  }

  async findOne(reservation_id: string, user_id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id },
      include: {
        service: true,
        pet: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    if (
      reservation.user_id !== user_id &&
      reservation.business_id !== user_id
    ) {
      throw new BadRequestException('해당 예약에 대한 권한이 없습니다.');
    }

    return reservation;
  }

  async update(
    reservation_id: string,
    user_id: string,
    updateReservationDto: UpdateReservationDto,
  ) {
    const reservation = await this.findOne(reservation_id, user_id);

    // 예약 상태가 PENDING이 아니면 수정 불가
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('수정 가능한 상태가 아닙니다.');
    }

    // 예약 시간이 지났으면 수정 불가
    if (isBefore(reservation.reserved_at, new Date())) {
      throw new BadRequestException('지난 예약은 수정할 수 없습니다.');
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { reservation_id },
      data: updateReservationDto,
      include: {
        service: true,
        pet: true,
      },
    });

    // 알림 생성
    await this.notificationsService.create(user_id, {
      type: NotificationType.RESERVATION_CREATED,
      title: '예약이 수정되었습니다',
      message: `${format(updatedReservation.reserved_at, 'yyyy년 MM월 dd일 HH:mm')}에 예약이 수정되었습니다.`,
      metadata: {
        reservation_id: updatedReservation.reservation_id,
        service_id: updatedReservation.service_id,
        pet_id: updatedReservation.pet_id,
        reserved_at: updatedReservation.reserved_at,
      },
    });

    return updatedReservation;
  }

  async cancel(reservation_id: string, user_id: string) {
    const reservation = await this.findOne(reservation_id, user_id);

    // 예약 상태가 PENDING이 아니면 취소 불가
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('취소 가능한 상태가 아닙니다.');
    }

    // 예약 시간이 지났으면 취소 불가
    if (isBefore(reservation.reserved_at, new Date())) {
      throw new BadRequestException('지난 예약은 취소할 수 없습니다.');
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { reservation_id },
      data: { status: ReservationStatus.CANCELED },
      include: {
        service: true,
        pet: true,
      },
    });

    // 알림 생성
    await this.notificationsService.create(user_id, {
      type: NotificationType.RESERVATION_CANCELED,
      title: '예약이 취소되었습니다',
      message: `${format(reservation.reserved_at, 'yyyy년 MM월 dd일 HH:mm')} 예약이 취소되었습니다.`,
      metadata: {
        reservation_id: reservation.reservation_id,
      },
    });

    return updatedReservation;
  }

  async getDisabledDates(service_id: string) {
    const service = await this.prisma.service.findUnique({
      where: { service_id },
    });

    if (!service) {
      throw new NotFoundException('서비스를 찾을 수 없습니다.');
    }

    const disabledDates = await this.prisma.businessAvailableTime.findMany({
      where: {
        service_id,
        type: ScheduleType.EXCEPTION,
        OR: [
          { start_time: '00:00', end_time: '00:00' },
          { start_time: '', end_time: '' },
        ],
      },
      select: {
        date: true,
        reason: true,
      },
    });

    return disabledDates;
  }

  async getBusinessesByService(service_id: string) {
    const service = await this.prisma.service.findUnique({
      where: { service_id },
      include: {
        admin: true,
      },
    });

    if (!service) {
      throw new NotFoundException('서비스를 찾을 수 없습니다.');
    }

    return service.admin;
  }

  async getAvailableTimesByDate(
    business_id: string,
    service_id: string,
    date: string,
  ) {
    const targetDate = new Date(date);
    const dayOfWeek = getDayOfWeek(targetDate);

    // 1. 주간 일정 조회
    const weeklySchedule = await this.prisma.businessAvailableTime.findFirst({
      where: {
        business_id,
        service_id,
        type: ScheduleType.WEEKLY,
        day_of_week: dayOfWeek,
      },
    });

    // 2. 예외 일정 조회
    const exceptionSchedule = await this.prisma.businessAvailableTime.findFirst(
      {
        where: {
          business_id,
          service_id,
          type: ScheduleType.EXCEPTION,
          date: targetDate,
        },
      },
    );

    // 3. 예약된 시간 조회
    const reservedTimes = await this.prisma.reservation.findMany({
      where: {
        business_id,
        service_id,
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sendDailyReservationReminders() {
    await this.sendReservationReminders();
  }

  async sendReservationReminders() {
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      0,
      0,
      0,
    );
    const tomorrowEnd = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      23,
      59,
      59,
    );

    const reservations = await this.prisma.reservation.findMany({
      where: {
        reserved_at: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
        status: ReservationStatus.CONFIRMED,
      },
      include: {
        user: true,
        service: true,
        pet: true,
      },
    });

    for (const reservation of reservations) {
      const formattedDate = format(
        reservation.reserved_at,
        'yyyy년 MM월 dd일 HH:mm',
      );

      // 사용자에게 알림 발송
      await this.notificationsService.create(reservation.user_id, {
        type: NotificationType.RESERVATION_REMINDER,
        title: '예약 알림',
        message: `내일 ${formattedDate}에 ${reservation.service.name} 예약이 있습니다.`,
        metadata: {
          reservation_id: reservation.reservation_id,
          service_id: reservation.service_id,
          pet_id: reservation.pet_id,
          reserved_at: reservation.reserved_at,
        },
      });

      // 비즈니스에게 알림 발송
      await this.notificationsService.create(reservation.business_id, {
        type: NotificationType.RESERVATION_REMINDER,
        title: '예약 알림',
        message: `내일 ${formattedDate}에 ${reservation.service.name} 예약이 있습니다.`,
        metadata: {
          reservation_id: reservation.reservation_id,
          service_id: reservation.service_id,
          pet_id: reservation.pet_id,
          reserved_at: reservation.reserved_at,
        },
      });
    }
  }

  async sendReservationStatusChangeNotification(
    reservation_id: string,
    status: ReservationStatus,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id },
      include: {
        user: true,
        service: true,
        pet: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    const formattedDate = format(
      reservation.reserved_at,
      'yyyy년 MM월 dd일 HH:mm',
    );
    let notificationType: NotificationType;
    let title: string;
    let message: string;

    switch (status) {
      case ReservationStatus.CONFIRMED:
        notificationType = NotificationType.RESERVATION_ACCEPTED;
        title = '예약이 승인되었습니다';
        message = `${formattedDate} 예약이 승인되었습니다.`;
        break;
      case ReservationStatus.REJECTED:
        notificationType = NotificationType.RESERVATION_REJECTED;
        title = '예약이 거절되었습니다';
        message = `${formattedDate} 예약이 거절되었습니다.`;
        break;
      case ReservationStatus.CANCELED:
        notificationType = NotificationType.RESERVATION_CANCELED;
        title = '예약이 취소되었습니다';
        message = `${formattedDate} 예약이 취소되었습니다.`;
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
}
