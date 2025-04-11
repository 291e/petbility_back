import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_UPDATED = 'RESERVATION_UPDATED',
  RESERVATION_ACCEPTED = 'RESERVATION_ACCEPTED',
  RESERVATION_REJECTED = 'RESERVATION_REJECTED',
  RESERVATION_CANCELED = 'RESERVATION_CANCELED',
  RESERVATION_REMINDER = 'RESERVATION_REMINDER',
}

export class NotificationData {
  @ApiProperty({
    enum: NotificationType,
    description: '알림 유형',
    example: 'RESERVATION_CREATED',
  })
  type: NotificationType;

  @ApiProperty({
    description: '알림 제목',
    example: '새로운 예약이 생성되었습니다',
  })
  title: string;

  @ApiProperty({
    description: '알림 메시지',
    example: '고객이 2024년 4월 8일 오후 2시에 예약을 생성했습니다.',
  })
  message: string;

  @ApiProperty({
    description: '추가 메타데이터',
    example: { reservationId: '123', businessId: '456' },
    required: false,
  })
  metadata?: Record<string, any>;
}

export class NotificationResponse {
  @ApiProperty({
    description: '알림 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    enum: NotificationType,
    description: '알림 유형',
    example: 'RESERVATION_CREATED',
  })
  type: NotificationType;

  @ApiProperty({
    description: '알림 제목',
    example: '새로운 예약이 생성되었습니다',
  })
  title: string;

  @ApiProperty({
    description: '알림 메시지',
    example: '고객이 2024년 4월 8일 오후 2시에 예약을 생성했습니다.',
  })
  message: string;

  @ApiProperty({
    description: '추가 메타데이터',
    example: { reservationId: '123', businessId: '456' },
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: '읽음 여부',
    example: false,
  })
  is_read: boolean;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-04-08T12:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-04-08T12:00:00Z',
  })
  updated_at: Date;
}
