// src/reservations/reservations.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Prisma, ReservationStatus } from '@prisma/client';
import { format, parseISO } from 'date-fns';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // 예약 생성
  async createReservation(userId: string, dto: CreateReservationDto) {
    const service = await this.prisma.service.findUnique({
      where: { service_id: dto.service_id },
    });

    if (!service) {
      throw new NotFoundException('서비스를 찾을 수 없습니다.');
    }

    // 1. 요일 구하기 (mon, tue, ...)
    const dayOfWeek = format(parseISO(dto.date), 'EEE')
      .toLowerCase()
      .slice(0, 3); // e.g. "mon"

    const availableTime = (service.available_time as any)?.[dayOfWeek] ?? [];

    // 2. 시간 일치하는지 확인
    if (!availableTime.includes(dto.time)) {
      throw new BadRequestException(
        `선택하신 날짜(${dto.date})의 시간(${dto.time})은 예약 가능한 시간이 아닙니다.`,
      );
    }

    // 3. 예약 생성
    const reservation = await this.prisma.reservation.create({
      data: {
        user_id: userId,
        service_id: dto.service_id,
        pet_id: dto.pet_id,
        business_id: service.business_id,
        date: new Date(dto.date),
        time: dto.time,
        notes: dto.notes || '',
        status: ReservationStatus.PENDING,
        price: service.price,
      },
    });

    // 4. 알림 생성 (사업자에게)
    const message = `📌 [${service.name}] 서비스에 새로운 예약 요청이 있습니다.`;

    await this.notificationsService.create({
      user_id: service.business_id,
      message,
      type: 'reservation',
    });

    // 5. 실시간 웹소켓 알림 전송
    this.notificationsGateway.sendNotificationToUser(
      service.business_id,
      message,
    );

    return reservation;
  }

  // // 예약 상태 변경
  // async updateReservationStatus(
  //   reservationId: string,
  //   status: ReservationStatus,
  //   businessId: string,
  // ) {
  //   const reservation = await this.prisma.reservation.findUnique({
  //     where: { reservation_id: reservationId },
  //   });

  //   if (!reservation) {
  //     throw new NotFoundException('예약을 찾을 수 없습니다.');
  //   }

  //   if (reservation.business_id !== businessId) {
  //     throw new ForbiddenException('본인의 예약만 변경할 수 있습니다.');
  //   }

  //   return this.prisma.reservation.update({
  //     where: { reservation_id: reservationId },
  //     data: { status },
  //   });
  // }

  // 내 예약 목록 조회
  async findUserReservations(
    userId: string,
    options: {
      status?: ReservationStatus;
      from?: string;
      to?: string;
      page: number;
      limit: number;
    },
  ) {
    const { status, from, to, page, limit } = options;

    const where: Prisma.ReservationWhereInput = {
      user_id: userId,
    };

    // 상태 필터
    if (status) {
      where.status = status;
    }

    // 날짜 필터
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    } else if (from) {
      where.date = { gte: new Date(from) };
    } else if (to) {
      where.date = { lte: new Date(to) };
    }

    const skip = (page - 1) * limit;

    const reservations = await this.prisma.reservation.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      skip,
      take: limit,
      include: {
        service: true,
        pet: true,
      },
    });

    if (!reservations || reservations.length === 0) {
      throw new NotFoundException('해당 조건에 맞는 예약이 없습니다.');
    }

    return reservations;
  }

  // 예약 상세 조회
  async findOne(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id: reservationId },
      include: {
        service: true,
        pet: true,
      },
    });

    if (!reservation || reservation.user_id !== userId) {
      throw new ForbiddenException('해당 예약에 접근할 수 없습니다.');
    }

    return reservation;
  }

  // 예약 취소
  async cancelReservation(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id: reservationId },
      include: { service: true },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    if (reservation.user_id !== userId) {
      throw new ForbiddenException('본인의 예약만 취소할 수 있습니다.');
    }

    if (reservation.status === 'COMPLETED') {
      throw new BadRequestException('완료된 예약은 취소할 수 없습니다.');
    }

    const canceled = await this.prisma.reservation.update({
      where: { reservation_id: reservationId },
      data: {
        status: 'CANCELED',
        updated_at: new Date(),
      },
    });

    // ✅ 사업자에게 알림
    await this.notificationsService.create({
      user_id: reservation.business_id,
      message: `고객이 '${reservation.service.name}' 예약을 취소했습니다.`,
      type: 'reservation',
    });

    return canceled;
  }
}
