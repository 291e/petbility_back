import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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

  async create(data: { user_id: string; message: string; type: string }) {
    return this.prisma.notification.create({ data });
  }
}
