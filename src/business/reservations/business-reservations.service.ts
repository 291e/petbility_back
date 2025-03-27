import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class BusinessReservationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findReservationsByBusiness(
    businessId: string,
    options: {
      status?: ReservationStatus;
      from?: string;
      to?: string;
      page: number;
      limit: number;
    },
  ) {
    const { status, from, to, page, limit } = options;

    const where: any = {
      business_id: businessId,
    };

    if (status) where.status = status;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
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
        user: true,
      },
    });

    if (reservations.length === 0) {
      throw new NotFoundException('예약이 존재하지 않습니다.');
    }

    return reservations;
  }

  async updateStatus(
    reservationId: string,
    businessId: string,
    status: ReservationStatus,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id: reservationId },
      include: { service: true },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    if (reservation.business_id !== businessId) {
      throw new ForbiddenException('본인의 예약만 상태를 변경할 수 있습니다.');
    }

    // 예약이 이미 완료되었거나 취소된 경우 제한
    if (['COMPLETED', 'CANCELED'].includes(reservation.status)) {
      throw new BadRequestException(
        '완료되거나 취소된 예약은 수정할 수 없습니다.',
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { reservation_id: reservationId },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    // ✅ 사용자에게 알림 발송
    await this.notificationsService.create({
      user_id: reservation.user_id,
      message: `예약하신 '${reservation.service.name}'의 상태가 '${status}'로 변경되었습니다.`,
      type: 'reservation',
    });

    return updated;
  }
}
