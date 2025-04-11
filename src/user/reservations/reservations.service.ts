import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { getDistanceInKm } from '@/utils/distance.util';
import {
  addHours,
  addMinutes,
  isBefore,
  isAfter,
  addDays,
  subDays,
  format,
} from 'date-fns';
import {
  generateTimeSlots,
  getDayOfWeek,
  getTimeOnly,
} from '@/utils/datetime.util';
import { Prisma, ReservationStatus, ServiceCategory } from '@prisma/client';
import { NotificationsService } from '@/notifications/notifications.service';
import { format as formatDate, parseISO } from 'date-fns';
import { NotificationType } from '@/notifications/types/notification.type';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async validateReservationTime(startTime: Date): Promise<void> {
    const now = new Date();
    const minReservationTime = addHours(now, 24); // 24시간 후부터 예약 가능
    const maxReservationTime = addDays(now, 30); // 30일 후까지만 예약 가능

    if (isBefore(startTime, minReservationTime)) {
      throw new BadRequestException('예약은 24시간 후부터 가능합니다.');
    }

    if (isAfter(startTime, maxReservationTime)) {
      throw new BadRequestException('예약은 30일 후까지만 가능합니다.');
    }
  }

  private async validateDuplicateReservation(
    business_id: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    // 1. 해당 시간에 예약 불가로 설정된 시간이 있는지 확인 (사업자가 차단한 시간)
    const blockedTime = await this.prisma.reservation.findFirst({
      where: {
        business_id,
        start_time: { lte: endTime },
        end_time: { gte: startTime },
        is_available: false,
      },
    });

    if (blockedTime) {
      throw new BadRequestException('해당 시간은 예약이 불가능합니다.');
    }

    // 2. 해당 시간에 이미 예약이 있는지 확인
    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        business_id,
        start_time: { lte: endTime },
        end_time: { gte: startTime },
        is_available: true,
        status: {
          notIn: [ReservationStatus.CANCELED, ReservationStatus.REJECTED],
        },
      },
    });

    if (existingReservation) {
      throw new BadRequestException('해당 시간에 이미 예약이 있습니다.');
    }
  }

  async create(user_id: string, createReservationDto: CreateReservationDto) {
    const {
      service_id,
      pet_id,
      start_time,
      end_time,
      is_available = true,
    } = createReservationDto;

    // 사용자 예약인지, 사업자의 차단 시간인지 확인
    if (is_available) {
      // 일반 사용자 예약
      if (!service_id || !pet_id) {
        throw new BadRequestException('서비스와 반려동물 정보는 필수입니다.');
      }

      // 1. 서비스 존재 여부 확인
      const service = await this.prisma.service.findUnique({
        where: { service_id },
      });

      if (!service) {
        throw new NotFoundException('서비스를 찾을 수 없습니다.');
      }

      // 2. 반려동물 존재 여부 및 소유자 확인
      const pet = await this.prisma.pet.findUnique({
        where: { pet_id },
        include: { user: true },
      });

      if (!pet) {
        throw new NotFoundException('반려동물을 찾을 수 없습니다.');
      }

      if (pet.user_id !== user_id) {
        throw new BadRequestException('해당 반려동물에 대한 권한이 없습니다.');
      }

      // 3. 예약 시간 유효성 검사
      const startTimeDate = parseISO(start_time);
      const endTimeDate = parseISO(end_time);
      if (isBefore(startTimeDate, new Date())) {
        throw new BadRequestException('과거 시간으로는 예약할 수 없습니다.');
      }

      if (
        isAfter(startTimeDate, endTimeDate) ||
        startTimeDate.getTime() === endTimeDate.getTime()
      ) {
        throw new BadRequestException('종료 시간은 시작 시간 이후여야 합니다.');
      }

      // 4. 중복 예약 확인
      await this.validateDuplicateReservation(
        service.admin_id,
        startTimeDate,
        endTimeDate,
      );

      // 5. 예약 생성
      const reservation = await this.prisma.reservation.create({
        data: {
          user_id,
          service_id,
          pet_id,
          business_id: service.admin_id,
          start_time: startTimeDate,
          end_time: endTimeDate,
          is_available: true,
          status: ReservationStatus.PENDING,
          price: service.price,
          notes: createReservationDto.notes,
        },
      });

      // 6. 알림 생성
      await this.notificationsService.create(user_id, {
        type: NotificationType.RESERVATION_CREATED,
        title: '예약이 생성되었습니다',
        message: `${format(startTimeDate, 'yyyy년 MM월 dd일 HH:mm')}에 예약이 생성되었습니다.`,
        metadata: {
          reservation_id: reservation.reservation_id,
        },
      });

      return reservation;
    } else {
      // 사업자의 차단 시간
      // 사업자가 자신의 서비스인지 확인
      if (service_id) {
        const service = await this.prisma.service.findUnique({
          where: { service_id },
        });

        if (!service || service.admin_id !== user_id) {
          throw new BadRequestException('해당 서비스에 대한 권한이 없습니다.');
        }
      }

      const startTimeDate = parseISO(start_time);
      const endTimeDate = parseISO(end_time);
      if (
        isAfter(startTimeDate, endTimeDate) ||
        startTimeDate.getTime() === endTimeDate.getTime()
      ) {
        throw new BadRequestException('종료 시간은 시작 시간 이후여야 합니다.');
      }

      // 사업자 차단 시간 생성
      const blockedTime = await this.prisma.reservation.create({
        data: {
          user_id,
          business_id: user_id,
          service_id,
          start_time: startTimeDate,
          end_time: endTimeDate,
          is_available: false,
          status: ReservationStatus.BLOCKED,
          notes: createReservationDto.notes,
        },
      });

      return blockedTime;
    }
  }

  async findAll(user_id: string, onlyAvailable: boolean = true) {
    return this.prisma.reservation.findMany({
      where: {
        OR: [{ user_id }, { business_id: user_id }],
        is_available: onlyAvailable ? true : undefined,
      },
      include: {
        service: true,
        pet: true,
      },
      orderBy: {
        start_time: 'desc',
      },
    });
  }

  async findOne(reservation_id: string, user_id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservation_id },
      include: {
        service: true,
        pet: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    if (
      reservation.user_id !== user_id &&
      reservation.business_id !== user_id
    ) {
      throw new BadRequestException('해당 예약에 대한 권한이 없습니다.');
    }

    return reservation;
  }

  async update(
    reservation_id: string,
    user_id: string,
    updateReservationDto: UpdateReservationDto,
  ) {
    const reservation = await this.findOne(reservation_id, user_id);

    // 예약 차단 시간인 경우 (사업자가 등록한 예약 불가 시간)
    if (!reservation.is_available) {
      // 사업자만 수정 가능
      if (
        reservation.business_id !== user_id ||
        reservation.user_id !== user_id
      ) {
        throw new BadRequestException('이 차단 시간을 수정할 권한이 없습니다.');
      }

      const updatedBlockedTime = await this.prisma.reservation.update({
        where: { reservation_id },
        data: {
          start_time: updateReservationDto.start_time
            ? parseISO(updateReservationDto.start_time)
            : undefined,
          end_time: updateReservationDto.end_time
            ? parseISO(updateReservationDto.end_time)
            : undefined,
          notes: updateReservationDto.notes,
        },
      });

      return updatedBlockedTime;
    }

    // 예약 상태가 PENDING이 아니면 수정 불가
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('수정 가능한 상태가 아닙니다.');
    }

    // 예약 시간이 지났으면 수정 불가
    if (isBefore(reservation.start_time, new Date())) {
      throw new BadRequestException('지난 예약은 수정할 수 없습니다.');
    }

    const updatedData: any = { ...updateReservationDto };
    if (updateReservationDto.start_time) {
      updatedData.start_time = parseISO(updateReservationDto.start_time);
    }
    if (updateReservationDto.end_time) {
      updatedData.end_time = parseISO(updateReservationDto.end_time);
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { reservation_id },
      data: updatedData,
      include: {
        service: true,
        pet: true,
      },
    });

    // 알림 생성
    await this.notificationsService.create(user_id, {
      type: NotificationType.RESERVATION_UPDATED,
      title: '예약이 수정되었습니다',
      message: `${format(updatedReservation.start_time, 'yyyy년 MM월 dd일 HH:mm')}에 예약이 수정되었습니다.`,
      metadata: {
        reservation_id: updatedReservation.reservation_id,
        service_id: updatedReservation.service_id,
        pet_id: updatedReservation.pet_id,
        start_time: updatedReservation.start_time,
      },
    });

    return updatedReservation;
  }

  async cancel(reservation_id: string, user_id: string) {
    const reservation = await this.findOne(reservation_id, user_id);

    // 차단된 시간인 경우 삭제
    if (!reservation.is_available) {
      if (reservation.business_id !== user_id) {
        throw new BadRequestException('이 차단 시간을 삭제할 권한이 없습니다.');
      }

      await this.prisma.reservation.delete({
        where: { reservation_id },
      });

      return { success: true, message: '차단 시간이 삭제되었습니다.' };
    }

    // 예약 상태가 PENDING이 아니면 취소 불가
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('취소 가능한 상태가 아닙니다.');
    }

    // 예약 시간이 지났으면 취소 불가
    if (isBefore(reservation.start_time, new Date())) {
      throw new BadRequestException('지난 예약은 취소할 수 없습니다.');
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { reservation_id },
      data: { status: ReservationStatus.CANCELED },
      include: {
        service: true,
        pet: true,
      },
    });

    // 알림 생성
    await this.notificationsService.create(user_id, {
      type: NotificationType.RESERVATION_CANCELED,
      title: '예약이 취소되었습니다',
      message: `${format(reservation.start_time, 'yyyy년 MM월 dd일 HH:mm')} 예약이 취소되었습니다.`,
      metadata: {
        reservation_id: reservation.reservation_id,
      },
    });

    return updatedReservation;
  }

  async getDisabledDates(business_id: string, date?: string) {
    try {
      // 특정 날짜가 제공된 경우 해당 날짜의 상세 차단 시간 정보 반환
      if (date) {
        const blocked_times = await this.prisma.reservation.findMany({
          where: {
            business_id,
            is_available: false,
            start_time: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`),
            },
          },
          select: {
            reservation_id: true,
            start_time: true,
            end_time: true,
            status: true,
          },
        });

        return {
          blocked_times,
        };
      }

      // 날짜 파라미터가 없는 경우 전체 예약 불가능 날짜 목록 반환
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      const blocked_times = await this.prisma.reservation.findMany({
        where: {
          business_id,
          is_available: false,
          start_time: {
            gte: new Date(),
            lte: thirtyDaysLater,
          },
        },
        select: {
          reservation_id: true,
          start_time: true,
          end_time: true,
          status: true,
        },
      });

      // 날짜별로 예약 불가능 시간 그룹화
      const blockedDates = blocked_times.reduce((acc, time) => {
        const dateStr = time.start_time.toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(time);
        return acc;
      }, {});

      // 완전히 예약 불가능한 날짜 (전체 영업 시간이 차단된 날짜) 필터링
      const disabledDates = Object.keys(blockedDates).filter((dateStr) => {
        const times = blockedDates[dateStr];
        // 이 부분은 비즈니스 로직에 따라 조정 필요
        // 예: 특정 날짜에 너무 많은 시간대가 차단되었거나, 특정 조건을 만족하는 경우
        return times.length >= 8; // 예시: 8개 이상의 시간대가 차단된 경우
      });

      return {
        disabled_dates: disabledDates,
      };
    } catch (error) {
      this.logger.error(`예약 불가능 날짜 조회 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException(
        '예약 불가능 날짜를 조회하는 중 오류가 발생했습니다.',
      );
    }
  }

  async getBusinessesByService(service_id: string) {
    // 먼저 서비스 존재 여부 확인
    const service = await this.prisma.service.findUnique({
      where: { service_id },
    });

    if (!service) {
      throw new NotFoundException('해당 서비스를 찾을 수 없습니다.');
    }

    // BusinessService 테이블을 통해 해당 서비스를 활성화한 사업자 검색
    const businessServices = await this.prisma.businessService.findMany({
      where: {
        service_id,
        is_active: true,
      },
      include: {
        business: {
          select: {
            user_id: true,
            email: true,
            name: true,
            profileImage: true,
            address: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        service: {
          select: {
            service_id: true,
            name: true,
            price: true,
            description: true,
            category: true,
          },
        },
      },
    });

    if (businessServices.length === 0) {
      throw new NotFoundException(
        '해당 서비스를 제공하는 사업자를 찾을 수 없습니다.',
      );
    }

    // 결과 포맷팅
    const businesses = businessServices.map((bs) => ({
      service_id: bs.service.service_id,
      service_name: bs.service.name,
      price: bs.service.price,
      business: bs.business,
    }));

    return businesses;
  }

  async getAvailableTimesByDate(
    business_id: string,
    service_id: string,
    date: string,
  ) {
    try {
      // 날짜 형식 검증
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new BadRequestException(
          '날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.',
        );
      }

      // 비즈니스 스케줄 정보 조회
      const businessSchedule = await this.prisma.businessSchedule.findFirst({
        where: {
          business_id,
          schedule_data: {
            not: Prisma.JsonNull,
          },
        },
      });

      if (!businessSchedule || !businessSchedule.schedule_data) {
        // 비즈니스 스케줄이 없는 경우, 차단된 시간대만 조회
        return this.getAvailableTimesByBlockedTimes(
          business_id,
          service_id,
          date,
        );
      }

      // 요일 계산
      const dayOfWeekIndex = targetDate.getDay(); // 0: 일요일, 1: 월요일, ...
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

      // 스케줄 데이터 파싱
      const scheduleData = businessSchedule.schedule_data as any;
      const daySchedule = scheduleData[dayOfWeek];

      // 휴무일인 경우
      if (daySchedule?.is_day_off) {
        return {
          date,
          is_day_off: true,
          available_time_slots: [],
          message: '휴무일입니다.',
        };
      }

      // 비즈니스 시간이 설정되어 있지 않은 경우
      if (
        !daySchedule?.working_hours?.start ||
        !daySchedule?.working_hours?.end
      ) {
        return this.getAvailableTimesByBlockedTimes(
          business_id,
          service_id,
          date,
        );
      }

      // 1. 차단된 시간대 조회
      const blockedTimes = await this.prisma.reservation.findMany({
        where: {
          business_id,
          is_available: false,
          status: ReservationStatus.BLOCKED,
          start_time: {
            gte: new Date(`${date}T00:00:00Z`),
            lt: new Date(`${date}T23:59:59Z`),
          },
        },
        select: {
          start_time: true,
          end_time: true,
        },
      });

      // 2. 예약된 시간대 조회
      const reservedTimes = await this.prisma.reservation.findMany({
        where: {
          business_id,
          service_id,
          is_available: true,
          start_time: {
            gte: new Date(`${date}T00:00:00Z`),
            lt: new Date(`${date}T23:59:59Z`),
          },
          status: {
            notIn: [ReservationStatus.CANCELED, ReservationStatus.REJECTED],
          },
        },
        select: {
          start_time: true,
          end_time: true,
        },
      });

      // 3. 시간대 생성 (비즈니스 영업 시간)
      const timeSlots = generateTimeSlots(
        daySchedule.working_hours.start,
        daySchedule.working_hours.end,
      );

      // 차단된 시간대 계산
      const blockedTimeSlots: { start: string; end: string }[] = [];

      // 휴식 시간 추가
      if (daySchedule.break_time) {
        blockedTimeSlots.push({
          start: daySchedule.break_time.start,
          end: daySchedule.break_time.end,
        });
      }

      // 예약된 시간 및 차단된 시간 추가
      blockedTimes.forEach((time) => {
        blockedTimeSlots.push({
          start: format(time.start_time, 'HH:mm'),
          end: format(time.end_time, 'HH:mm'),
        });
      });

      reservedTimes.forEach((time) => {
        blockedTimeSlots.push({
          start: format(time.start_time, 'HH:mm'),
          end: format(time.end_time, 'HH:mm'),
        });
      });

      // 4. 예약된 시간 및 차단된 시간 제외
      const availableTimeSlots = timeSlots.filter((slot) => {
        // 슬롯 시작 시간과 종료 시간 계산 (종료 시간은 시작 시간 + 30분)
        const [slotHour, slotMinute] = slot.split(':').map(Number);

        let endHour = slotHour;
        let endMinute = slotMinute + 30;
        if (endMinute >= 60) {
          endHour += 1;
          endMinute -= 60;
        }
        const slotEnd = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        return !blockedTimeSlots.some((blockedTime) => {
          const blockedStart = blockedTime.start;
          const blockedEnd = blockedTime.end;

          return (
            (slot >= blockedStart && slot < blockedEnd) ||
            (slotEnd > blockedStart && slotEnd <= blockedEnd) ||
            (slot <= blockedStart && slotEnd >= blockedEnd)
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
        },
        break_time: daySchedule.break_time
          ? {
              start_time: daySchedule.break_time.start,
              end_time: daySchedule.break_time.end,
              reason: daySchedule.break_time.reason || '휴식 시간',
            }
          : null,
      };
    } catch (error) {
      this.logger.error(`예약 가능 시간 조회 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException(
        '예약 가능 시간을 조회하는 중 오류가 발생했습니다.',
      );
    }
  }

  // 기존 방식으로 예약 가능 시간 조회 (차단된 시간만 고려)
  private async getAvailableTimesByBlockedTimes(
    business_id: string,
    service_id: string,
    date: string,
  ) {
    // 1. 차단된 시간대 조회
    const blockedTimes = await this.prisma.reservation.findMany({
      where: {
        business_id,
        is_available: false,
        status: ReservationStatus.BLOCKED,
        start_time: {
          gte: new Date(`${date}T00:00:00Z`),
          lt: new Date(`${date}T23:59:59Z`),
        },
      },
      select: {
        start_time: true,
        end_time: true,
      },
    });

    // 2. 예약된 시간대 조회
    const reservedTimes = await this.prisma.reservation.findMany({
      where: {
        business_id,
        service_id,
        is_available: true,
        start_time: {
          gte: new Date(`${date}T00:00:00Z`),
          lt: new Date(`${date}T23:59:59Z`),
        },
        status: {
          notIn: [ReservationStatus.CANCELED, ReservationStatus.REJECTED],
        },
      },
      select: {
        start_time: true,
        end_time: true,
      },
    });

    // 3. 시간대 생성 (기본: 09:00 ~ 18:00)
    const timeSlots = generateTimeSlots('09:00', '18:00');

    // 차단된 시간대 계산
    const blockedTimeSlots: { start: string; end: string }[] = [];

    // 예약된 시간 및 차단된 시간 추가
    blockedTimes.forEach((time) => {
      blockedTimeSlots.push({
        start: format(time.start_time, 'HH:mm'),
        end: format(time.end_time, 'HH:mm'),
      });
    });

    reservedTimes.forEach((time) => {
      blockedTimeSlots.push({
        start: format(time.start_time, 'HH:mm'),
        end: format(time.end_time, 'HH:mm'),
      });
    });

    // 4. 예약된 시간 및 차단된 시간 제외
    const availableTimeSlots = timeSlots.filter((slot) => {
      // 슬롯 시작 시간과 종료 시간 계산 (종료 시간은 시작 시간 + 30분)
      const [slotHour, slotMinute] = slot.split(':').map(Number);

      let endHour = slotHour;
      let endMinute = slotMinute + 30;
      if (endMinute >= 60) {
        endHour += 1;
        endMinute -= 60;
      }
      const slotEnd = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      return !blockedTimeSlots.some((blockedTime) => {
        const blockedStart = blockedTime.start;
        const blockedEnd = blockedTime.end;

        return (
          (slot >= blockedStart && slot < blockedEnd) ||
          (slotEnd > blockedStart && slotEnd <= blockedEnd) ||
          (slot <= blockedStart && slotEnd >= blockedEnd)
        );
      });
    });

    return {
      date,
      is_day_off: false,
      available_time_slots: availableTimeSlots,
      weekly_schedule: null,
      break_time: null,
    };
  }

  /**
   * 모든 서비스 목록을 조회합니다.
   * 서비스 카테고리별로 대표 서비스를 포함한 전체 서비스 목록을 반환합니다.
   */
  async getAllServices() {
    try {
      // 모든 서비스 카테고리 기반으로 검색
      const categories = Object.values(ServiceCategory);

      // 카테고리별 서비스 조회
      const services = await this.prisma.service.findMany({
        select: {
          service_id: true,
          name: true,
          description: true,
          price: true,
          category: true,
          admin: {
            select: {
              user_id: true,
              name: true,
            },
          },
        },
        orderBy: {
          category: 'asc',
        },
      });

      // 카테고리별로 그룹화
      const servicesByCategory = categories
        .map((category) => {
          const categoryServices = services.filter(
            (service) => service.category === category,
          );

          // 카테고리에 서비스가 없는 경우 기본 서비스 생성 (옵션)
          if (categoryServices.length === 0) {
            return null;
          }

          return {
            category,
            services: categoryServices,
          };
        })
        .filter(Boolean);

      return servicesByCategory.length > 0 ? services : [];
    } catch (error) {
      this.logger.error(`서비스 목록 조회 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException(
        '서비스 목록을 조회하는 중 오류가 발생했습니다.',
      );
    }
  }

  /**
   * 사용자의 반려동물 목록을 조회합니다.
   * @param user_id 사용자 ID
   * @returns 사용자의 반려동물 목록
   */
  async getUserPets(user_id: string) {
    try {
      const pets = await this.prisma.pet.findMany({
        where: {
          user_id,
        },
        select: {
          pet_id: true,
          name: true,
          species: true,
          breed: true,
          age: true,
          weight: true,
        },
      });

      return pets;
    } catch (error) {
      this.logger.error(`반려동물 목록 조회 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException(
        '반려동물 목록을 조회하는 중 오류가 발생했습니다.',
      );
    }
  }

  /**
   * 특정 비즈니스와 서비스에 대한 예약 가능 스케줄을 조회합니다.
   * 월 단위 조회시 전체 예약 불가능한 날짜 목록을 반환하고,
   * 일 단위 조회시 해당 날짜의 예약 가능 시간 목록을 반환합니다.
   *
   * @param business_id 비즈니스 ID
   * @param service_id 서비스 ID
   * @param date 날짜 (YYYY-MM 또는 YYYY-MM-DD 형식)
   * @returns 예약 가능 스케줄 정보
   */
  async getAvailableSchedule(
    business_id: string,
    service_id: string,
    date: string,
  ) {
    try {
      // 날짜 형식 확인 (YYYY-MM 또는 YYYY-MM-DD)
      const isMonthFormat = /^\d{4}-\d{2}$/.test(date);
      const isDayFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);

      if (!isMonthFormat && !isDayFormat) {
        throw new BadRequestException(
          '날짜 형식이 올바르지 않습니다. YYYY-MM 또는 YYYY-MM-DD 형식으로 입력해주세요.',
        );
      }

      // 월 단위 조회 (YYYY-MM)
      if (isMonthFormat) {
        const [year, month] = date.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1); // 해당 월의 첫날
        const endDate = new Date(year, month, 0); // 해당 월의 마지막 날

        // 비즈니스 스케줄 정보 (요일별 영업 시간) 조회
        const businessSchedule = await this.prisma.businessSchedule.findFirst({
          where: {
            business_id,
          },
        });

        // 해당 월의 예약 불가능 날짜 조회
        const blocked_times = await this.prisma.reservation.findMany({
          where: {
            business_id,
            is_available: false,
            status: ReservationStatus.BLOCKED,
            start_time: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            reservation_id: true,
            start_time: true,
            end_time: true,
          },
        });

        // 해당 월의 예약된 시간 조회
        const reserved_times = await this.prisma.reservation.findMany({
          where: {
            business_id,
            service_id,
            is_available: true,
            start_time: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              notIn: [ReservationStatus.CANCELED, ReservationStatus.REJECTED],
            },
          },
          select: {
            reservation_id: true,
            start_time: true,
            end_time: true,
          },
        });

        // 날짜별로 예약 불가능 시간 그룹화
        const blockedDatesMap = blocked_times.reduce((acc, time) => {
          const dateStr = time.start_time.toISOString().split('T')[0];
          if (!acc[dateStr]) {
            acc[dateStr] = [];
          }
          acc[dateStr].push(time);
          return acc;
        }, {});

        // 날짜별로 예약된 시간 그룹화
        const reservedDatesMap = reserved_times.reduce((acc, time) => {
          const dateStr = time.start_time.toISOString().split('T')[0];
          if (!acc[dateStr]) {
            acc[dateStr] = [];
          }
          acc[dateStr].push(time);
          return acc;
        }, {});

        // 요일별 휴무일 정보 계산
        const dayOffMap = {};
        if (businessSchedule?.schedule_data) {
          const scheduleData = businessSchedule.schedule_data as any;

          // 각 요일별 휴무일 정보 저장
          const daysOfWeek = [
            'SUNDAY',
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
          ];

          daysOfWeek.forEach((day, index) => {
            const daySchedule = scheduleData[day];
            if (daySchedule?.is_day_off) {
              dayOffMap[index] = true;
            }
          });
        }

        // 날짜별 가용성 정보 계산
        const daysInMonth = endDate.getDate();
        const availabilityByDate = {};

        for (let day = 1; day <= daysInMonth; day++) {
          // 현재 날짜 생성 (시간대를 고려하여 정확한 날짜로 생성)
          const currentDate = new Date(Date.UTC(year, month - 1, day));
          const dateStr = currentDate.toISOString().split('T')[0];

          // 요일 계산 (한국 시간대 고려)
          const dayOfWeek = currentDate.getUTCDay(); // 0: 일요일, 1: 월요일, ...

          // 휴무일 여부 확인
          const isDayOff = dayOffMap[dayOfWeek] || false;

          // 완전히 차단된 날짜 여부 확인 (예: 8시간 이상 차단된 경우)
          const isFullyBlocked = blockedDatesMap[dateStr]?.length >= 8 || false;

          // 가용성 정보 저장
          availabilityByDate[dateStr] = {
            date: dateStr,
            day_of_week: dayOfWeek,
            is_day_off: isDayOff,
            is_fully_blocked: isFullyBlocked,
            has_reservations: !!reservedDatesMap[dateStr],
            blocked_count: blockedDatesMap[dateStr]?.length || 0,
            reserved_count: reservedDatesMap[dateStr]?.length || 0,
          };
        }

        return {
          year,
          month,
          days_in_month: daysInMonth,
          availability_by_date: availabilityByDate,
        };
      }

      // 일 단위 조회 (YYYY-MM-DD)
      if (isDayFormat) {
        // 기존 getAvailableTimesByDate 메소드 로직 활용
        const availableTimesResult = await this.getAvailableTimesByDate(
          business_id,
          service_id,
          date,
        );

        return {
          detailed_date: date,
          ...availableTimesResult,
        };
      }
    } catch (error) {
      this.logger.error(`예약 가능 스케줄 조회 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException(
        '예약 가능 스케줄을 조회하는 중 오류가 발생했습니다.',
      );
    }
  }
}
