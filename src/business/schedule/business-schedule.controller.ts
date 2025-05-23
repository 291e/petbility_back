import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { BusinessScheduleService } from './business-schedule.service';
import { ManageAvailableTimeDto } from './dto/manage-available-time.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

/**
 * 비즈니스 일정 관리 컨트롤러
 * 영업 시간, 휴무일, 휴식 시간 등의 일정을 관리합니다.
 */
@ApiTags('Business Schedule')
@Controller('business/schedule')
@UseGuards(AuthGuard, RolesGuard)
@Roles('BUSINESS')
export class BusinessScheduleController {
  constructor(
    private readonly businessScheduleService: BusinessScheduleService,
  ) {}

  /**
   * 비즈니스 영업 일정을 설정합니다.
   * @param business_id 비즈니스 ID
   * @param dto 영업 일정 정보
   * @returns 설정 결과 메시지
   */
  @ApiOperation({
    summary: '비즈니스 영업 일정 관리',
    description:
      '비즈니스의 영업 일정을 관리합니다. 주간 일정과 예외 일정(휴식시간, 휴무일 등)을 설정할 수 있습니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiBody({ type: ManageAvailableTimeDto })
  @ApiResponse({ status: 200, description: '영업 일정 설정 성공' })
  @Post(':business_id')
  manageSchedule(
    @Param('business_id') business_id: string,
    @Body() dto: ManageAvailableTimeDto,
  ) {
    return this.businessScheduleService.manageSchedule(business_id, dto);
  }

  /**
   * 비즈니스 영업 일정을 조회합니다.
   * @param business_id 비즈니스 ID
   * @returns 영업 일정 정보
   */
  @ApiOperation({
    summary: '비즈니스 영업 일정 조회',
    description:
      '비즈니스의 전체 영업 일정을 조회합니다. 주간 일정과 휴식 시간을 요일별로 구조화하여 반환합니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiResponse({
    status: 200,
    description: '영업 일정 조회 성공',
    schema: {
      properties: {
        business_id: { type: 'string', description: '비즈니스 ID' },
        schedule: {
          type: 'object',
          description: '요일별 일정 데이터',
          properties: {
            MONDAY: {
              type: 'object',
              properties: {
                is_day_off: { type: 'boolean', description: '휴무일 여부' },
                working_hours: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    start: {
                      type: 'string',
                      description: '영업 시작 시간 (HH:mm 형식)',
                    },
                    end: {
                      type: 'string',
                      description: '영업 종료 시간 (HH:mm 형식)',
                    },
                  },
                },
                break_time: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    start: {
                      type: 'string',
                      description: '휴식 시작 시간 (HH:mm 형식)',
                    },
                    end: {
                      type: 'string',
                      description: '휴식 종료 시간 (HH:mm 형식)',
                    },
                    reason: { type: 'string', description: '휴식 사유' },
                  },
                },
              },
            },
            // 다른 요일들에 대한 구조도 동일함
          },
        },
      },
    },
  })
  @Get(':business_id')
  getSchedule(@Param('business_id') business_id: string) {
    return this.businessScheduleService.getSchedule(business_id);
  }

  /**
   * 특정 날짜의 예약 가능 시간을 조회합니다.
   * @param business_id 비즈니스 ID
   * @param date 조회할 날짜 (YYYY-MM-DD 형식)
   * @returns 예약 가능 시간 슬롯
   */
  @ApiOperation({
    summary: '특정 날짜의 예약 가능 시간 조회',
    description:
      '특정 날짜의 예약 가능한 시간 슬롯을 조회합니다. 영업 시간, 예약된 시간, 예외 일정을 고려하여 30분 단위로 사용 가능한 시간대를 반환합니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiQuery({
    name: 'date',
    description: '조회할 날짜 (YYYY-MM-DD 형식)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '예약 가능 시간 조회 성공',
    schema: {
      properties: {
        date: { type: 'string', description: '조회한 날짜 (YYYY-MM-DD 형식)' },
        is_day_off: { type: 'boolean', description: '휴무일 여부' },
        available_time_slots: {
          type: 'array',
          items: { type: 'string' },
          description: '예약 가능한 시간 슬롯 (HH:mm 형식, 30분 단위)',
        },
        weekly_schedule: {
          type: 'object',
          description: '해당 요일의 기본 영업 시간',
          properties: {
            day_of_week: { type: 'string', description: '요일' },
            start_time: {
              type: 'string',
              description: '영업 시작 시간 (HH:mm 형식)',
            },
            end_time: {
              type: 'string',
              description: '영업 종료 시간 (HH:mm 형식)',
            },
            is_day_off: { type: 'boolean', description: '휴무일 여부' },
          },
        },
        exception_schedule: {
          type: 'array',
          description: '해당 날짜의 예외 일정 (휴식 시간, 특별 휴무 등)',
          items: {
            type: 'object',
            properties: {
              start_time: {
                type: 'string',
                description: '시작 시간 (HH:mm 형식)',
              },
              end_time: {
                type: 'string',
                description: '종료 시간 (HH:mm 형식)',
              },
              reason: {
                type: 'string',
                nullable: true,
                description: '예외 사유 (휴식 시간, 특별 휴무 등)',
              },
              type: {
                type: 'string',
                description: '예외 타입 (BREAK, HOLIDAY 등)',
              },
            },
          },
        },
      },
    },
  })
  @Get(':business_id/date')
  getAvailableTimeByDate(
    @Param('business_id') business_id: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException('날짜를 입력해주세요 (YYYY-MM-DD 형식)');
    }
    return this.businessScheduleService.getAvailableTimeByDate(
      business_id,
      date,
    );
  }
}
