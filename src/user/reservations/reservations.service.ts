import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { getDistanceInKm } from '@/utils/distance.util';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateReservationDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { latitude: true, longitude: true },
    });

    if (!user?.latitude || !user?.longitude) {
      throw new NotFoundException('사용자의 위치 정보가 없습니다.');
    }

    const availableBusinesses =
      await this.prisma.businessAvailableTime.findMany({
        where: {
          day_of_week: this.getDayOfWeek(dto.reserved_at),
          start_time: { lte: this.getTime(dto.reserved_at) },
          end_time: { gt: this.getTime(dto.reserved_at) },
        },
        include: {
          business: {
            select: {
              user_id: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      });

    const sorted = availableBusinesses
      .filter(
        (b) => b.business.latitude != null && b.business.longitude != null,
      )
      .map((b) => ({
        ...b,
        distance: getDistanceInKm(
          user.latitude!,
          user.longitude!,
          b.business.latitude!,
          b.business.longitude!,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (!sorted.length) {
      throw new NotFoundException('유효한 위치 정보를 가진 사업자가 없습니다.');
    }

    const matched = sorted[0];

    return this.prisma.reservation.create({
      data: {
        user_id: userId,
        service_id: dto.service_id,
        pet_id: dto.pet_id,
        reserved_at: new Date(dto.reserved_at),
        notes: dto.notes,
        business_id: matched.business.user_id,
        status: 'COMPLETED',
      },
    });
  }

  async findMyReservations(userId: string) {
    return this.prisma.reservation.findMany({
      where: { user_id: userId },
      include: {
        service: true,
        pet: true,
        business: true,
      },
      orderBy: { reserved_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id: id },
      include: {
        service: true,
        pet: true,
        business: true,
      },
    });

    if (!reservation) throw new NotFoundException('예약이 존재하지 않습니다.');
    if (reservation.user_id !== userId)
      throw new ForbiddenException('내 예약이 아닙니다.');

    return reservation;
  }

  // 🧠 유틸: 요일 문자열 구하기
  private getDayOfWeek(dateStr: string): string {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[new Date(dateStr).getDay()];
  }

  // 🧠 유틸: 시간만 추출
  private getTime(dateStr: string): string {
    return new Date(dateStr).toTimeString().slice(0, 5); // 'HH:MM'
  }
}
