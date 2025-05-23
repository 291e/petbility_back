import { Test, TestingModule } from '@nestjs/testing';
import { BusinessScheduleController } from './business-schedule.controller';
import { BusinessScheduleService } from './business-schedule.service';
import { ManageAvailableTimeDto } from './dto/manage-available-time.dto';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';

// 모킹 데이터
const mockScheduleData = {
  business_id: 'business1',
  schedule: {
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
  },
};

const mockAvailableTimeData = {
  date: '2023-05-01',
  is_day_off: false,
  available_time_slots: ['09:00', '09:30', '10:00'],
  weekly_schedule: {
    day_of_week: 'MONDAY',
    start_time: '09:00',
    end_time: '18:00',
    is_day_off: false,
  },
  exception_schedule: [
    {
      start_time: '12:00',
      end_time: '13:00',
      reason: '휴식 시간',
      type: 'BREAK',
    },
  ],
};

// 서비스 모킹
const mockBusinessScheduleService = {
  manageSchedule: jest.fn(),
  getSchedule: jest.fn(),
  getAvailableTimeByDate: jest.fn(),
};

describe('BusinessScheduleController', () => {
  let controller: BusinessScheduleController;
  let service: BusinessScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessScheduleController],
      providers: [
        {
          provide: BusinessScheduleService,
          useValue: mockBusinessScheduleService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BusinessScheduleController>(
      BusinessScheduleController,
    );
    service = module.get<BusinessScheduleService>(BusinessScheduleService);

    // 모킹 리셋
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('manageSchedule', () => {
    it('should create and return a schedule', async () => {
      // 모킹
      mockBusinessScheduleService.manageSchedule.mockResolvedValue({
        message: '영업 일정이 성공적으로 설정되었습니다.',
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
      const result = await controller.manageSchedule('business1', dto);

      // 검증
      expect(mockBusinessScheduleService.manageSchedule).toHaveBeenCalledWith(
        'business1',
        dto,
      );
      expect(result).toEqual({
        message: '영업 일정이 성공적으로 설정되었습니다.',
      });
    });
  });

  describe('getSchedule', () => {
    it('should return a schedule', async () => {
      // 모킹
      mockBusinessScheduleService.getSchedule.mockResolvedValue(
        mockScheduleData,
      );

      // 테스트
      const result = await controller.getSchedule('business1');

      // 검증
      expect(mockBusinessScheduleService.getSchedule).toHaveBeenCalledWith(
        'business1',
      );
      expect(result).toEqual(mockScheduleData);
    });
  });

  describe('getAvailableTimeByDate', () => {
    it('should return available time slots for a specific date', async () => {
      // 모킹
      mockBusinessScheduleService.getAvailableTimeByDate.mockResolvedValue(
        mockAvailableTimeData,
      );

      // 테스트
      const result = await controller.getAvailableTimeByDate(
        'business1',
        '2023-05-01',
      );

      // 검증
      expect(
        mockBusinessScheduleService.getAvailableTimeByDate,
      ).toHaveBeenCalledWith('business1', '2023-05-01');
      expect(result).toEqual(mockAvailableTimeData);
    });

    it('should throw BadRequestException when date is not provided', async () => {
      // 테스트 및 검증
      try {
        await controller.getAvailableTimeByDate('business1', '');
        // 여기에 도달하면 실패
        fail('BadRequestException이 발생하지 않았습니다');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toBe('날짜를 입력해주세요 (YYYY-MM-DD 형식)');
      }
    });
  });
});
