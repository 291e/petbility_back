import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from './types/notification.type';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendReservationNotification(
    to: string,
    type: NotificationType,
    data: {
      title: string;
      message: string;
      reservationId: string;
      serviceName: string;
      petName: string;
      reservedAt: Date;
    },
  ) {
    const { title, message, reservationId, serviceName, petName, reservedAt } =
      data;
    const formattedDate = new Date(reservedAt).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let subject = '';
    let template = '';

    switch (type) {
      case NotificationType.RESERVATION_CREATED:
        subject = '새로운 예약이 생성되었습니다';
        template = `
          <h2>새로운 예약이 생성되었습니다</h2>
          <p>${message}</p>
          <p>서비스: ${serviceName}</p>
          <p>반려동물: ${petName}</p>
          <p>예약 시간: ${formattedDate}</p>
          <p>예약 ID: ${reservationId}</p>
        `;
        break;
      case NotificationType.RESERVATION_ACCEPTED:
        subject = '예약이 승인되었습니다';
        template = `
          <h2>예약이 승인되었습니다</h2>
          <p>${message}</p>
          <p>서비스: ${serviceName}</p>
          <p>반려동물: ${petName}</p>
          <p>예약 시간: ${formattedDate}</p>
          <p>예약 ID: ${reservationId}</p>
        `;
        break;
      case NotificationType.RESERVATION_REJECTED:
        subject = '예약이 거절되었습니다';
        template = `
          <h2>예약이 거절되었습니다</h2>
          <p>${message}</p>
          <p>서비스: ${serviceName}</p>
          <p>반려동물: ${petName}</p>
          <p>예약 시간: ${formattedDate}</p>
          <p>예약 ID: ${reservationId}</p>
        `;
        break;
      case NotificationType.RESERVATION_CANCELED:
        subject = '예약이 취소되었습니다';
        template = `
          <h2>예약이 취소되었습니다</h2>
          <p>${message}</p>
          <p>서비스: ${serviceName}</p>
          <p>반려동물: ${petName}</p>
          <p>예약 시간: ${formattedDate}</p>
          <p>예약 ID: ${reservationId}</p>
        `;
        break;
      case NotificationType.RESERVATION_REMINDER:
        subject = '예약 리마인더';
        template = `
          <h2>예약 리마인더</h2>
          <p>${message}</p>
          <p>서비스: ${serviceName}</p>
          <p>반려동물: ${petName}</p>
          <p>예약 시간: ${formattedDate}</p>
          <p>예약 ID: ${reservationId}</p>
        `;
        break;
      default:
        return;
    }

    await this.mailerService.sendMail({
      to,
      subject,
      html: template,
    });
  }
}
