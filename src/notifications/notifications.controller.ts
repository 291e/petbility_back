import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@/auth/auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({
    summary: '읽지 않은 알림 조회',
    description: '사용자의 읽지 않은 알림을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '읽지 않은 알림 목록 조회 성공' })
  @Get('unread')
  findUnread(@Req() req: Request) {
    return this.notificationsService.findUnread(req.user.id);
  }

  @ApiOperation({
    summary: '읽은 알림 조회',
    description: '사용자의 읽은 알림을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '읽은 알림 목록 조회 성공' })
  @Get('read')
  findRead(@Req() req: Request) {
    return this.notificationsService.findRead(req.user.id);
  }

  @ApiOperation({
    summary: '읽지 않은 알림 개수 조회',
    description: '사용자의 읽지 않은 알림 개수를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '읽지 않은 알림 개수 조회 성공' })
  @Get('count')
  getUnreadCount(@Req() req: Request) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @ApiOperation({
    summary: '알림 읽음 처리',
    description: '특정 알림을 읽음 처리합니다.',
  })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: 200, description: '알림 읽음 처리 성공' })
  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @ApiOperation({
    summary: '모든 알림 읽음 처리',
    description: '사용자의 모든 알림을 읽음 처리합니다.',
  })
  @ApiResponse({ status: 200, description: '모든 알림 읽음 처리 성공' })
  @Post('read-all')
  markAllAsRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @ApiOperation({
    summary: '알림 삭제',
    description: '특정 알림을 삭제합니다.',
  })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: 200, description: '알림 삭제 성공' })
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.delete(id, req.user.id);
  }

  @ApiOperation({
    summary: '모든 알림 삭제',
    description: '사용자의 모든 알림을 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '모든 알림 삭제 성공' })
  @Delete()
  deleteAll(@Req() req: Request) {
    return this.notificationsService.deleteAll(req.user.id);
  }
}
