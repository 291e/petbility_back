import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // 알림 목록 조회
  @Get()
  getNotifications(@Request() req, @Query('unread') unreadOnly?: string) {
    const userId = req.user.user_id;
    return this.service.getMyNotifications(userId, unreadOnly === 'true');
  }

  // 개별 알림 읽음 처리
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.user_id;
    return this.service.markAsRead(id, userId);
  }

  // ✅ 안 읽은 알림 수 조회
  @Get('unread-count')
  getUnreadCount(@Request() req) {
    const userId = req.user.user_id;
    return this.service.getUnreadCount(userId);
  }

  // 전체 알림 읽음
  @Patch('read-all')
  markAllAsRead(@Request() req) {
    const userId = req.user.user_id;
    return this.service.markAllAsRead(userId);
  }

  // 알림 삭제
  @Delete(':id')
  deleteNotification(@Param('id') id: string, @Request() req) {
    const userId = req.user.user_id;
    return this.service.deleteNotification(id, userId);
  }
}
