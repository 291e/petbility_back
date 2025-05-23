// src/business/reservations/business-reservations.service.ts

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { Prisma, ReservationStatus, ServiceCategory } from '@prisma/client';
import { format } from 'date-fns';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/types/notification.type';

@Injectable()
export class BusinessReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(business_id: string) {
    return this.prisma.reservation.findMany({
      where: {
        business_id,
        is_available: true,
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, address: true },
        },
        pet: true,
        service: true,
      },
      orderBy: { start_time: 'desc' },
    });
  }

  async findOne(reservation_id: string, business_id: string) {
    // UUID 유효성 검사
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reservation_id)) {
      throw new BadRequestException('유효하지 않은 예약 ID 형식입니다.');
    }

    if (!uuidRegex.test(business_id)) {
      throw new BadRequestException('유효하지 않은 비즈니스 ID 형식입니다.');
    }

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
      reservation.start_time,
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
        start_time: reservation.start_time,
      },
    });
  }

  // 사업자 서비스 관리 관련 메소드
  async getBusinessServices(business_id: string) {
    // 모든 서비스 카테고리 조회
    const categories = Object.values(ServiceCategory);

    // 현재 사업자가 활성화한 서비스 조회
    const activeServices = await this.prisma.businessService.findMany({
      where: {
        business_id,
      },
      include: {
        service: true,
      },
    });

    // 카테고리별 서비스 목록 생성
    const services = await Promise.all(
      categories.map(async (category) => {
        // 해당 카테고리에 대표 서비스 찾기
        const baseService = await this.prisma.service.findFirst({
          where: {
            category,
          },
        });

        if (!baseService) {
          return null;
        }

        // 이 카테고리의 서비스가 활성화되어 있는지 확인
        const activeService = activeServices.find(
          (as) => as.service.category === category,
        );

        return {
          service_id: activeService?.service_id || baseService.service_id,
          name: baseService.name,
          description: baseService.description,
          price: baseService.price,
          category: baseService.category,
          status: activeService ? 'active' : 'inactive',
        };
      }),
    );

    // null 값 제거 및 반환
    return services.filter(Boolean);
  }

  async updateServiceStatus(
    business_id: string,
    service_id: string,
    status: 'active' | 'inactive',
  ) {
    // 서비스 존재 여부 확인
    const service = await this.prisma.service.findUnique({
      where: { service_id },
    });

    if (!service) {
      throw new NotFoundException('해당 서비스를 찾을 수 없습니다.');
    }

    // 활성화 상태로 변경하는 경우
    if (status === 'active') {
      // 이미 존재하는지 확인
      const existingLink = await this.prisma.businessService.findFirst({
        where: {
          business_id,
          service_id,
        },
      });

      if (existingLink) {
        // 이미 있다면 활성화 상태로 업데이트
        return this.prisma.businessService.update({
          where: { id: existingLink.id },
          data: { is_active: true },
        });
      } else {
        // 없다면 새로 생성
        return this.prisma.businessService.create({
          data: {
            business_id,
            service_id,
            is_active: true,
          },
        });
      }
    } else {
      // 비활성화 상태로 변경하는 경우
      const existingLink = await this.prisma.businessService.findFirst({
        where: {
          business_id,
          service_id,
        },
      });

      if (!existingLink) {
        // 없는 경우 이미 비활성화 상태라고 간주
        return { message: '이미 비활성화된 서비스입니다.' };
      }

      // 있는 경우 비활성화로 업데이트
      return this.prisma.businessService.update({
        where: { id: existingLink.id },
        data: { is_active: false },
      });
    }
  }
}
