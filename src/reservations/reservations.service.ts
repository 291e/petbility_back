// src/reservations/reservations.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 예약 생성
  async createReservation(userId: string, dto: CreateReservationDto) {
    const service = await this.prisma.service.findUnique({
      where: { service_id: dto.service_id },
    });

    if (!service) {
      throw new NotFoundException('서비스를 찾을 수 없습니다.');
    }

    return this.prisma.reservation.create({
      data: {
        user_id: userId,
        service_id: dto.service_id,
        pet_id: dto.pet_id,
        business_id: service.business_id,
        date: new Date(dto.date),
        time: dto.time,
        notes: dto.notes || '',
        status: ReservationStatus.PENDING,
      },
    });
  }

  // 내 예약 목록 조회
  async findUserReservations(userId: string) {
    return this.prisma.reservation.findMany({
      where: { user_id: userId },
      orderBy: { date: 'asc' },
      include: {
        service: true,
        pet: true,
      },
    });
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
    });

    if (!reservation || reservation.user_id !== userId) {
      throw new ForbiddenException('해당 예약을 취소할 권한이 없습니다.');
    }

    return this.prisma.reservation.update({
      where: { reservation_id: reservationId },
      data: {
        status: ReservationStatus.CANCELED,
      },
    });
  }
}
