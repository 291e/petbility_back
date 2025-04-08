import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationData } from './types/notification.type';
import { Prisma } from '@prisma/client';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // 내 알림 목록 조회
  async getMyNotifications(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly && { is_read: false }),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
    return { unreadCount: count };
  }

  // 알림 읽음 처리
  async markAsRead(notificationId: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { notification_id: notificationId },
    });

    if (!notif || notif.user_id !== userId) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    return this.prisma.notification.update({
      where: { notification_id: notificationId },
      data: { is_read: true },
    });
  }

  // 전체 알림 읽음 처리
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });
  }

  // 알림 삭제
  async deleteNotification(notificationId: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { notification_id: notificationId },
    });

    if (!notif || notif.user_id !== userId) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    return this.prisma.notification.delete({
      where: { notification_id: notificationId },
    });
  }

  async create(userId: string, data: NotificationData) {
    // 사용자 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 알림 생성
    const notification = await this.prisma.notification.create({
      data: {
        user_id: userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        is_read: false,
      },
    });

    // 예약 관련 알림인 경우 이메일 발송
    if (
      data.type.includes('RESERVATION') &&
      user.email &&
      data.metadata?.reservation_id &&
      data.metadata?.service_id &&
      data.metadata?.pet_id &&
      data.metadata?.reserved_at
    ) {
      // 서비스 정보 조회
      const service = await this.prisma.service.findUnique({
        where: { service_id: data.metadata.service_id },
      });

      // 반려동물 정보 조회
      const pet = await this.prisma.pet.findUnique({
        where: { pet_id: data.metadata.pet_id },
      });

      if (service && pet) {
        await this.emailService.sendReservationNotification(
          user.email,
          data.type,
          {
            title: data.title,
            message: data.message,
            reservationId: data.metadata.reservation_id,
            serviceName: service.name,
            petName: pet.name,
            reservedAt: new Date(data.metadata.reserved_at),
          },
        );
      }
    }

    return notification;
  }

  async createMany(
    notifications: Array<{ userId: string; data: NotificationData }>,
  ) {
    const data = notifications.map(({ userId, data }) => ({
      user_id: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      is_read: false,
    }));

    return this.prisma.notification.createMany({ data });
  }

  async findUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findRead(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        user_id: userId,
        is_read: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async delete(notificationId: string, userId: string) {
    return this.prisma.notification.delete({
      where: {
        notification_id: notificationId,
        user_id: userId,
      },
    });
  }

  async deleteAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        user_id: userId,
      },
    });
  }
}
