// src/business/reservations/business-reservations.service.ts

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

@Injectable()
export class BusinessReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessId: string) {
    return this.prisma.reservation.findMany({
      where: { business_id: businessId },
      include: {
        user: true,
        pet: true,
        service: true,
      },
      orderBy: {
        reserved_at: 'asc',
      },
    });
  }

  async findOne(id: string, businessId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id: id },
      include: {
        user: true,
        pet: true,
        service: true,
      },
    });

    if (!reservation) throw new NotFoundException('예약을 찾을 수 없습니다.');
    if (reservation.business_id !== businessId)
      throw new ForbiddenException('본인에게 할당된 예약이 아닙니다.');

    return reservation;
  }

  async updateStatus(
    id: string,
    businessId: string,
    dto: UpdateReservationStatusDto,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id: id },
    });

    if (!reservation) throw new NotFoundException('예약을 찾을 수 없습니다.');
    if (reservation.business_id !== businessId)
      throw new ForbiddenException('예약 변경 권한이 없습니다.');

    return this.prisma.reservation.update({
      where: { reservation_id: id },
      data: { status: dto.status },
    });
  }
}
