import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from './types/notification.type';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;
  let configService: ConfigService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendReservationNotification', () => {
    it('should send reservation created notification email', async () => {
      const to = 'test@example.com';
      const type = NotificationType.RESERVATION_CREATED;
      const data = {
        title: 'Test Title',
        message: 'Test Message',
        reservationId: 'test-reservation-id',
        serviceName: 'Test Service',
        petName: 'Test Pet',
        reservedAt: new Date('2023-01-01T10:00:00Z'),
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendReservationNotification(to, type, data);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: '새로운 예약이 생성되었습니다',
        html: expect.stringContaining('새로운 예약이 생성되었습니다'),
      });
    });

    it('should send reservation accepted notification email', async () => {
      const to = 'test@example.com';
      const type = NotificationType.RESERVATION_ACCEPTED;
      const data = {
        title: 'Test Title',
        message: 'Test Message',
        reservationId: 'test-reservation-id',
        serviceName: 'Test Service',
        petName: 'Test Pet',
        reservedAt: new Date('2023-01-01T10:00:00Z'),
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendReservationNotification(to, type, data);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: '예약이 승인되었습니다',
        html: expect.stringContaining('예약이 승인되었습니다'),
      });
    });

    it('should send reservation rejected notification email', async () => {
      const to = 'test@example.com';
      const type = NotificationType.RESERVATION_REJECTED;
      const data = {
        title: 'Test Title',
        message: 'Test Message',
        reservationId: 'test-reservation-id',
        serviceName: 'Test Service',
        petName: 'Test Pet',
        reservedAt: new Date('2023-01-01T10:00:00Z'),
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendReservationNotification(to, type, data);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: '예약이 거절되었습니다',
        html: expect.stringContaining('예약이 거절되었습니다'),
      });
    });

    it('should send reservation canceled notification email', async () => {
      const to = 'test@example.com';
      const type = NotificationType.RESERVATION_CANCELED;
      const data = {
        title: 'Test Title',
        message: 'Test Message',
        reservationId: 'test-reservation-id',
        serviceName: 'Test Service',
        petName: 'Test Pet',
        reservedAt: new Date('2023-01-01T10:00:00Z'),
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendReservationNotification(to, type, data);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: '예약이 취소되었습니다',
        html: expect.stringContaining('예약이 취소되었습니다'),
      });
    });

    it('should send reservation reminder notification email', async () => {
      const to = 'test@example.com';
      const type = NotificationType.RESERVATION_REMINDER;
      const data = {
        title: 'Test Title',
        message: 'Test Message',
        reservationId: 'test-reservation-id',
        serviceName: 'Test Service',
        petName: 'Test Pet',
        reservedAt: new Date('2023-01-01T10:00:00Z'),
      };

      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendReservationNotification(to, type, data);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: '예약 리마인더',
        html: expect.stringContaining('예약 리마인더'),
      });
    });

    it('should not send email for unknown notification type', async () => {
      const to = 'test@example.com';
      const type = 'UNKNOWN_TYPE' as NotificationType;
      const data = {
        title: 'Test Title',
        message: 'Test Message',
        reservationId: 'test-reservation-id',
        serviceName: 'Test Service',
        petName: 'Test Pet',
        reservedAt: new Date('2023-01-01T10:00:00Z'),
      };

      await service.sendReservationNotification(to, type, data);

      expect(mockMailerService.sendMail).not.toHaveBeenCalled();
    });
  });
});
