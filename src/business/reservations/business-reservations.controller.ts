// src/business/reservations/business-reservations.controller.ts

import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Request,
  Logger,
} from '@nestjs/common';
import { BusinessReservationsService } from './business-reservations.service';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';

@ApiTags('비즈니스 예약 및 서비스 관리')
@Controller('business/reservations')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class BusinessReservationsController {
  private readonly logger = new Logger(BusinessReservationsController.name);

  constructor(
    private readonly businessReservationsService: BusinessReservationsService,
  ) {}

  @ApiOperation({
    summary: '모든 예약 조회',
    description: '비즈니스의 모든 예약을 조회합니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiResponse({
    status: 200,
    description: '예약 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          reservation_id: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: [
              'PENDING',
              'CONFIRMED',
              'COMPLETED',
              'CANCELED',
              'REJECTED',
              'NO_SHOW',
            ],
          },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          service: {
            type: 'object',
            properties: {
              service_id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @Get()
  findAll(@Param('business_id') business_id: string) {
    return this.businessReservationsService.findAll(business_id);
  }

  @ApiOperation({
    summary: '단일 예약 조회',
    description: '특정 예약의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'reservation_id', description: '예약 ID' })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiResponse({ status: 200, description: '예약 조회 성공' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @Get(':reservation_id')
  findOne(
    @Param('reservation_id') reservation_id: string,
    @Param('business_id') business_id: string,
  ) {
    return this.businessReservationsService.findOne(
      reservation_id,
      business_id,
    );
  }

  @ApiOperation({
    summary: '예약 상태 업데이트',
    description:
      '예약의 상태를 업데이트합니다. 상태는 CONFIRMED, REJECTED, COMPLETED, NO_SHOW 등으로 변경 가능합니다.',
  })
  @ApiParam({ name: 'reservation_id', description: '예약 ID' })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiBody({ type: UpdateReservationStatusDto })
  @ApiResponse({ status: 200, description: '예약 상태 업데이트 성공' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @Patch(':reservation_id/status')
  updateStatus(
    @Param('reservation_id') reservation_id: string,
    @Param('business_id') business_id: string,
    @Body() updateReservationStatusDto: UpdateReservationStatusDto,
  ) {
    return this.businessReservationsService.updateStatus(
      reservation_id,
      business_id,
      updateReservationStatusDto,
    );
  }

  @ApiOperation({
    summary: '내 서비스 목록 조회',
    description:
      '사업자가 제공할 수 있는 모든 서비스 목록과 현재 활성화 상태를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '서비스 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          service_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          category: {
            type: 'string',
            enum: [
              'cremation',
              'bathing',
              'funeral',
              'grooming',
              'custom_vehicles',
              'other_care',
            ],
          },
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      },
    },
  })
  @Get('/my-services')
  async getMyServices(@Request() req) {
    const user_id = req.user.user_id;

    return this.businessReservationsService.getBusinessServices(user_id);
  }

  @ApiOperation({
    summary: '서비스 활성화/비활성화',
    description:
      '사업자가 특정 서비스의 제공 여부를 활성화하거나 비활성화합니다.',
  })
  @ApiParam({
    name: 'service_id',
    required: true,
    description: '서비스 ID',
  })
  @ApiBody({
    type: UpdateServiceStatusDto,
    description: '서비스 상태 업데이트 정보',
    examples: {
      활성화: {
        value: { status: 'active' },
        description: '서비스를 활성화합니다.',
      },
      비활성화: {
        value: { status: 'inactive' },
        description: '서비스를 비활성화합니다.',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '서비스 상태 변경 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        business_id: { type: 'string' },
        service_id: { type: 'string' },
        is_active: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '서비스를 찾을 수 없음' })
  @Patch('/my-services/:service_id/status')
  async updateServiceStatus(
    @Request() req,
    @Param('service_id') service_id: string,
    @Body() updateServiceStatusDto: UpdateServiceStatusDto,
  ) {
    this.logger.debug(`Request user: ${JSON.stringify(req.user)}`);
    const user_id = req.user.user_id;
    this.logger.debug(`Using user_id: ${user_id} for updateServiceStatus`);
    return this.businessReservationsService.updateServiceStatus(
      user_id,
      service_id,
      updateServiceStatusDto.status,
    );
  }
}
