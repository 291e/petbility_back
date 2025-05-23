import { Test, TestingModule } from '@nestjs/testing';
import { BusinessScheduleService } from './business-schedule.service';
import { PrismaService } from 'prisma/prisma.service';
import { ManageAvailableTimeDto } from './dto/manage-available-time.dto';
import { ScheduleType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// 모킹 데이터
const mockScheduleData = {
  SUNDAY: {
    is_day_off: true,
    working_hours: null,
    break_time: null,
  },
  MONDAY: {
    is_day_off: false,
    working_hours: {
      start: '09:00',
      end: '18:00',
    },
    break_time: {
      start: '12:00',
      end: '13:00',
      reason: '휴식 시간',
    },
  },
  TUESDAY: {
    is_day_off: false,
    working_hours: {
      start: '09:00',
      end: '18:00',
    },
    break_time: {
      start: '12:00',
      end: '13:00',
      reason: '휴식 시간',
    },
  },
};

// PrismaService 모킹
const mockPrismaService = {
  businessSchedule: {
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  reservation: {
    findMany: jest.fn(),
  },
};

describe('BusinessScheduleService', () => {
  let service: BusinessScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessScheduleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BusinessScheduleService>(BusinessScheduleService);

    // 모킹 리셋
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('manageSchedule', () => {
    it('should create a new schedule', async () => {
      // 모킹
      mockPrismaService.businessSchedule.deleteMany.mockResolvedValue({
        count: 0,
      });
      mockPrismaService.businessSchedule.create.mockResolvedValue({
        id: 'schedule1',
        business_id: 'business1',
        schedule_data: mockScheduleData,
      });

      const dto: ManageAvailableTimeDto = {
        schedule: {
          selectedDays: [false, true, true, true, true, true, false],
          startTime: '09:00',
          endTime: '18:00',
          breakTime: {
            start: '12:00',
            end: '13:00',
          },
        },
      };

      // 테스트
      const result = await service.manageSchedule('business1', dto);

      // 검증
      expect(
        mockPrismaService.businessSchedule.deleteMany,
      ).toHaveBeenCalledWith({
        where: { business_id: 'business1' },
      });
      expect(mockPrismaService.businessSchedule.create).toHaveBeenCalled();
      expect(result).toEqual({
        message: '영업 일정이 성공적으로 설정되었습니다.',
      });
    });

    it('should throw BadRequestException when schedule is missing', async () => {
      const dto = {} as ManageAvailableTimeDto;

      await expect(service.manageSchedule('business1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getSchedule', () => {
    it('should return a schedule', async () => {
      // 모킹
      mockPrismaService.businessSchedule.findFirst.mockResolvedValue({
        id: 'schedule1',
        business_id: 'business1',
        schedule_data: mockScheduleData,
      });

      // 테스트
      const result = await service.getSchedule('business1');

      // 검증
      expect(mockPrismaService.businessSchedule.findFirst).toHaveBeenCalledWith(
        {
          where: {
            business_id: 'business1',
            NOT: { schedule_data: null },
          },
        },
      );
      expect(result).toEqual({
        business_id: 'business1',
        schedule: mockScheduleData,
      });
    });

    it('should throw NotFoundException when schedule is not found', async () => {
      // 모킹
      mockPrismaService.businessSchedule.findFirst.mockResolvedValue(null);

      // 테스트 및 검증
      await expect(service.getSchedule('business1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAvailableTimeByDate', () => {
    it('should return available time slots for a specific date', async () => {
      // 모킹 - 월요일 데이터 조회
      mockPrismaService.businessSchedule.findFirst.mockResolvedValue({
        id: 'schedule1',
        business_id: 'business1',
        schedule_data: mockScheduleData,
      });
      mockPrismaService.reservation.findMany.mockResolvedValue([]);

      // 테스트 - 2023-05-01은 월요일
      const result = await service.getAvailableTimeByDate(
        'business1',
        '2023-05-01',
      );

      // 검증
      expect(mockPrismaService.businessSchedule.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.reservation.findMany).toHaveBeenCalled();
      expect(result).toHaveProperty('date', '2023-05-01');
      expect(result).toHaveProperty('is_day_off', false);
      expect(result).toHaveProperty('available_time_slots');
      expect(result.weekly_schedule).toEqual({
        day_of_week: 'MONDAY',
        start_time: '09:00',
        end_time: '18:00',
        is_day_off: false,
      });
    });

    it('should return empty slots for a day off', async () => {
      // 모킹 - 일요일 데이터 조회 (휴무일)
      mockPrismaService.businessSchedule.findFirst.mockResolvedValue({
        id: 'schedule1',
        business_id: 'business1',
        schedule_data: mockScheduleData,
      });

      // 테스트 - 2023-04-30은 일요일
      const result = await service.getAvailableTimeByDate(
        'business1',
        '2023-04-30',
      );

      // 검증
      expect(result).toEqual({
        date: '2023-04-30',
        is_day_off: true,
        available_time_slots: [],
        weekly_schedule: {
          day_of_week: 'SUNDAY',
          is_day_off: true,
        },
        exception_schedule: [],
      });
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(
        service.getAvailableTimeByDate('business1', 'invalid-date'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when schedule is not found', async () => {
      // 모킹
      mockPrismaService.businessSchedule.findFirst.mockResolvedValue(null);

      // 테스트 및 검증
      await expect(
        service.getAvailableTimeByDate('business1', '2023-05-01'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle reservations correctly', async () => {
      // 모킹 - 월요일 데이터 조회
      mockPrismaService.businessSchedule.findFirst.mockResolvedValue({
        id: 'schedule1',
        business_id: 'business1',
        schedule_data: mockScheduleData,
      });

      // 예약 데이터 모킹 (09:00~10:00 KST)
      mockPrismaService.reservation.findMany.mockResolvedValue([
        {
          start_time: new Date('2023-05-01T00:00:00Z'), // 09:00 KST
          end_time: new Date('2023-05-01T01:00:00Z'), // 10:00 KST
        },
      ]);

      // 테스트
      const result = await service.getAvailableTimeByDate(
        'business1',
        '2023-05-01',
      );

      // 검증 (09:00, 09:30은 차단되어야 함)
      expect(result.available_time_slots).not.toContain('09:00');
      expect(result.available_time_slots).not.toContain('09:30');
    });
  });
});
