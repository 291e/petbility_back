import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from 'prisma/prisma.service';
import { EmailService } from './email.service';
import { NotificationType } from './types/notification.type';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  const mockPrismaService = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    pet: {
      findUnique: jest.fn(),
    },
  };

  const mockEmailService = {
    sendReservationNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyNotifications', () => {
    it('should return notifications for a user', async () => {
      const userId = 'test-user-id';
      const mockNotifications = [
        { notification_id: '1', user_id: userId, is_read: false },
        { notification_id: '2', user_id: userId, is_read: true },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.getMyNotifications(userId);

      expect(result).toEqual(mockNotifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return only unread notifications when unreadOnly is true', async () => {
      const userId = 'test-user-id';
      const mockNotifications = [
        { notification_id: '1', user_id: userId, is_read: false },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.getMyNotifications(userId, true);

      expect(result).toEqual(mockNotifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: userId, is_read: false },
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      const userId = 'test-user-id';
      const mockCount = 5;

      mockPrismaService.notification.count.mockResolvedValue(mockCount);

      const result = await service.getUnreadCount(userId);

      expect(result).toEqual({ unreadCount: mockCount });
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { user_id: userId, is_read: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 'test-notification-id';
      const userId = 'test-user-id';
      const mockNotification = {
        notification_id: notificationId,
        user_id: userId,
        is_read: false,
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );
      mockPrismaService.notification.update.mockResolvedValue({
        ...mockNotification,
        is_read: true,
      });

      const result = await service.markAsRead(notificationId, userId);

      expect(result.is_read).toBe(true);
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { notification_id: notificationId },
        data: { is_read: true },
      });
    });

    it('should throw NotFoundException if notification is not found', async () => {
      const notificationId = 'test-notification-id';
      const userId = 'test-user-id';

      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if notification does not belong to user', async () => {
      const notificationId = 'test-notification-id';
      const userId = 'test-user-id';
      const mockNotification = {
        notification_id: notificationId,
        user_id: 'different-user-id',
        is_read: false,
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const userId = 'test-user-id';
      const mockResult = { count: 5 };

      mockPrismaService.notification.updateMany.mockResolvedValue(mockResult);

      const result = await service.markAllAsRead(userId);

      expect(result).toEqual(mockResult);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { user_id: userId, is_read: false },
        data: { is_read: true },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = 'test-notification-id';
      const userId = 'test-user-id';
      const mockNotification = {
        notification_id: notificationId,
        user_id: userId,
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );
      mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

      const result = await service.deleteNotification(notificationId, userId);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.delete).toHaveBeenCalledWith({
        where: { notification_id: notificationId },
      });
    });

    it('should throw NotFoundException if notification is not found', async () => {
      const notificationId = 'test-notification-id';
      const userId = 'test-user-id';

      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteNotification(notificationId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if notification does not belong to user', async () => {
      const notificationId = 'test-notification-id';
      const userId = 'test-user-id';
      const mockNotification = {
        notification_id: notificationId,
        user_id: 'different-user-id',
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );

      await expect(
        service.deleteNotification(notificationId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a notification and send email for reservation notification', async () => {
      const userId = 'test-user-id';
      const mockUser = {
        user_id: userId,
        email: 'test@example.com',
      };
      const mockService = {
        service_id: 'test-service-id',
        name: 'Test Service',
      };
      const mockPet = {
        pet_id: 'test-pet-id',
        name: 'Test Pet',
      };
      const mockNotification = {
        notification_id: 'test-notification-id',
        user_id: userId,
        type: NotificationType.RESERVATION_CREATED,
        title: 'Test Title',
        message: 'Test Message',
        metadata: {
          reservation_id: 'test-reservation-id',
          service_id: 'test-service-id',
          pet_id: 'test-pet-id',
          reserved_at: '2023-01-01T10:00:00Z',
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.pet.findUnique.mockResolvedValue(mockPet);
      mockEmailService.sendReservationNotification.mockResolvedValue(undefined);

      const result = await service.create(userId, {
        type: NotificationType.RESERVATION_CREATED,
        title: 'Test Title',
        message: 'Test Message',
        metadata: {
          reservation_id: 'test-reservation-id',
          service_id: 'test-service-id',
          pet_id: 'test-pet-id',
          reserved_at: '2023-01-01T10:00:00Z',
        },
      });

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalled();
      expect(mockEmailService.sendReservationNotification).toHaveBeenCalled();
    });

    it('should create a notification without sending email for non-reservation notification', async () => {
      const userId = 'test-user-id';
      const mockUser = {
        user_id: userId,
        email: 'test@example.com',
      };
      const mockNotification = {
        notification_id: 'test-notification-id',
        user_id: userId,
        type: NotificationType.RESERVATION_CREATED,
        title: 'Test Title',
        message: 'Test Message',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(userId, {
        type: NotificationType.RESERVATION_CREATED,
        title: 'Test Title',
        message: 'Test Message',
      });

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalled();
      expect(
        mockEmailService.sendReservationNotification,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = 'test-user-id';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(userId, {
          type: NotificationType.RESERVATION_CREATED,
          title: 'Test Title',
          message: 'Test Message',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMany', () => {
    it('should create multiple notifications', async () => {
      const mockNotifications = [
        {
          userId: 'user1',
          data: {
            type: NotificationType.RESERVATION_CREATED,
            title: 'Title 1',
            message: 'Message 1',
          },
        },
        {
          userId: 'user2',
          data: {
            type: NotificationType.RESERVATION_ACCEPTED,
            title: 'Title 2',
            message: 'Message 2',
          },
        },
      ];

      const mockResult = { count: 2 };

      mockPrismaService.notification.createMany.mockResolvedValue(mockResult);

      const result = await service.createMany(mockNotifications);

      expect(result).toEqual(mockResult);
      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            user_id: 'user1',
            type: NotificationType.RESERVATION_CREATED,
            title: 'Title 1',
            message: 'Message 1',
            is_read: false,
          }),
          expect.objectContaining({
            user_id: 'user2',
            type: NotificationType.RESERVATION_ACCEPTED,
            title: 'Title 2',
            message: 'Message 2',
            is_read: false,
          }),
        ]),
      });
    });
  });

  describe('findUnread', () => {
    it('should return unread notifications for a user', async () => {
      const userId = 'test-user-id';
      const mockNotifications = [
        { notification_id: '1', user_id: userId, is_read: false },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.findUnread(userId);

      expect(result).toEqual(mockNotifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: userId, is_read: false },
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('findRead', () => {
    it('should return read notifications for a user', async () => {
      const userId = 'test-user-id';
      const mockNotifications = [
        { notification_id: '1', user_id: userId, is_read: true },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.findRead(userId);

      expect(result).toEqual(mockNotifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: userId, is_read: true },
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      const notificationId = 'test-notification-id';
      const userId = 'test-user-id';
      const mockNotification = {
        notification_id: notificationId,
        user_id: userId,
      };

      mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

      const result = await service.delete(notificationId, userId);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.delete).toHaveBeenCalledWith({
        where: { notification_id: notificationId, user_id: userId },
      });
    });
  });

  describe('deleteAll', () => {
    it('should delete all notifications for a user', async () => {
      const userId = 'test-user-id';
      const mockResult = { count: 5 };

      mockPrismaService.notification.deleteMany.mockResolvedValue(mockResult);

      const result = await service.deleteAll(userId);

      expect(result).toEqual(mockResult);
      expect(mockPrismaService.notification.deleteMany).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
    });
  });
});
