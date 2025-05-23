import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ManageAvailableTimeDto } from './dto/manage-available-time.dto';
import { addDays, format, parse, isValid } from 'date-fns';
import { generateTimeSlots } from '../../utils/datetime.util';
import { ScheduleType } from '@prisma/client';

@Injectable()
export class BusinessScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사업자의 영업 일정을 관리합니다.
   * @param business_id 사업자 ID
   * @param dto 영업 일정 정보
   * @throws {BadRequestException} 주간 일정이 없는 경우
   */
  async manageSchedule(business_id: string, dto: ManageAvailableTimeDto) {
    // 유효성 검사
    if (!dto.schedule) {
      throw new BadRequestException('주간 일정은 필수입니다.');
    }

    const daysOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    // 요일별 데이터 구성
    const scheduleData = {};

    // 각 요일별 데이터 생성
    for (let i = 0; i < daysOfWeek.length; i++) {
      const day = daysOfWeek[i];
      const isDaySelected = dto.schedule.selectedDays[i];

      if (!isDaySelected) {
        // 휴무일 설정
        scheduleData[day] = {
          is_day_off: true,
          working_hours: null,
          break_time: null,
        };
      } else {
        // 영업일 설정
        scheduleData[day] = {
          is_day_off: false,
          working_hours: {
            start: dto.schedule.startTime,
            end: dto.schedule.endTime,
          },
          break_time: dto.schedule.breakTime
            ? {
                start: dto.schedule.breakTime.start,
                end: dto.schedule.breakTime.end,
                reason: '휴식 시간',
              }
            : null,
        };
      }
    }

    // 기존 스케줄 삭제하고 새로운 스케줄 생성
    await this.prisma.businessSchedule.deleteMany({
      where: { business_id },
    });

    // JSON 형태로 데이터 저장
    await (this.prisma.businessSchedule.create as any)({
      data: {
        business_id,
        schedule_data: scheduleData,
      },
    });

    return { message: '영업 일정이 성공적으로 설정되었습니다.' };
  }

  /**
   * 사업자의 전체 영업 일정을 조회합니다.
   * @param business_id 사업자 ID
   * @throws {NotFoundException} 일정을 찾을 수 없는 경우
   */
  async getSchedule(business_id: string) {
    // 데이터베이스에서 조회
    const scheduleRecord = await (
      this.prisma.businessSchedule.findFirst as any
    )({
      where: {
        business_id,
        NOT: {
          schedule_data: null,
        },
      },
    });

    if (!scheduleRecord) {
      throw new NotFoundException(
        `비즈니스 ID ${business_id}의 일정을 찾을 수 없습니다.`,
      );
    }

    // 데이터 형식 변환 및 반환
    return {
      business_id,
      schedule: scheduleRecord.schedule_data,
    };
  }

  /**
   * 특정 날짜의 예약 가능 시간을 조회합니다.
   * @param business_id 사업자 ID
   * @param date 날짜 (YYYY-MM-DD)
   * @throws {BadRequestException} 날짜 형식이 올바르지 않은 경우
   * @throws {NotFoundException} 일정을 찾을 수 없는 경우
   */
  async getAvailableTimeByDate(business_id: string, date: string) {
    // 날짜 형식 검증
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (!isValid(parsedDate)) {
      throw new BadRequestException(
        '날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.',
      );
    }

    // 요일 계산
    const dayOfWeekIndex = parsedDate.getDay(); // 0: 일요일, 1: 월요일, ...
    const daysOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const dayOfWeek = daysOfWeek[dayOfWeekIndex];

    // 스케줄 데이터 조회
    const scheduleRecord = await (
      this.prisma.businessSchedule.findFirst as any
    )({
      where: {
        business_id,
        NOT: {
          schedule_data: null,
        },
      },
    });

    if (!scheduleRecord) {
      throw new NotFoundException(
        `비즈니스 ID ${business_id}의 일정을 찾을 수 없습니다.`,
      );
    }

    const scheduleData = scheduleRecord.schedule_data as any;
    const daySchedule = scheduleData[dayOfWeek];

    // 휴무일인 경우
    if (daySchedule.is_day_off) {
      return {
        date,
        is_day_off: true,
        available_time_slots: [],
        weekly_schedule: {
          day_of_week: dayOfWeek,
          is_day_off: true,
        },
        exception_schedule: [],
      };
    }

    // 해당 날짜의 예약 정보 조회
    const reservations = await this.prisma.reservation.findMany({
      where: {
        business_id,
        start_time: {
          gte: new Date(`${date}T00:00:00Z`),
          lt: new Date(`${date}T23:59:59Z`),
        },
        NOT: {
          status: {
            in: ['CANCELED', 'REJECTED'],
          },
        },
      },
      select: {
        start_time: true,
        end_time: true,
      },
    });

    // 사용 가능한 시간 슬롯 계산
    const timeSlots = generateTimeSlots(
      daySchedule.working_hours.start,
      daySchedule.working_hours.end,
    );

    // 차단된 시간대 계산
    const blockedTimes: { start: string; end: string }[] = [];

    // 휴식 시간 추가
    if (daySchedule.break_time) {
      blockedTimes.push({
        start: daySchedule.break_time.start,
        end: daySchedule.break_time.end,
      });
    }

    // 예약된 시간 추가
    reservations.forEach((reservation) => {
      blockedTimes.push({
        start: format(reservation.start_time, 'HH:mm'),
        end: format(
          reservation.end_time ||
            new Date(reservation.start_time.getTime() + 60 * 60000),
          'HH:mm',
        ),
      });
    });

    // 차단된 시간대를 제외한 가용 시간 슬롯 계산
    const availableTimeSlots = timeSlots.filter((slot) => {
      return !blockedTimes.some((blockedTime) => {
        if (!blockedTime.start || !blockedTime.end) return false;

        // 슬롯 시작 시간과 종료 시간 계산 (종료 시간은 시작 시간 + 30분)
        const slotStart = slot;
        const [slotHour, slotMinute] = slotStart.split(':').map(Number);

        let endHour = slotHour;
        let endMinute = slotMinute + 30;
        if (endMinute >= 60) {
          endHour += 1;
          endMinute -= 60;
        }
        const slotEnd = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        const blockedStart = blockedTime.start;
        const blockedEnd = blockedTime.end;

        return (
          (slotStart >= blockedStart && slotStart < blockedEnd) ||
          (slotEnd > blockedStart && slotEnd <= blockedEnd) ||
          (slotStart <= blockedStart && slotEnd >= blockedEnd)
        );
      });
    });

    // 결과 반환
    return {
      date,
      is_day_off: false,
      available_time_slots: availableTimeSlots,
      weekly_schedule: {
        day_of_week: dayOfWeek,
        start_time: daySchedule.working_hours.start,
        end_time: daySchedule.working_hours.end,
        is_day_off: daySchedule.is_day_off,
      },
      exception_schedule: daySchedule.break_time
        ? [
            {
              start_time: daySchedule.break_time.start,
              end_time: daySchedule.break_time.end,
              reason: daySchedule.break_time.reason,
              type: 'BREAK',
            },
          ]
        : [],
    };
  }
}
