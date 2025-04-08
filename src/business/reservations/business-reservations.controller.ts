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
} from '@nestjs/common';
import { BusinessReservationsService } from './business-reservations.service';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ManageAvailableTimeDto } from './dto/manage-available-time.dto';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Business Reservations')
@Controller('business/reservations')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class BusinessReservationsController {
  constructor(
    private readonly businessReservationsService: BusinessReservationsService,
  ) {}

  @ApiOperation({
    summary: '모든 예약 조회',
    description: '비즈니스의 모든 예약을 조회합니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiResponse({ status: 200, description: '예약 목록 조회 성공' })
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
    description: '예약의 상태를 업데이트합니다.',
  })
  @ApiParam({ name: 'reservation_id', description: '예약 ID' })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiBody({ type: UpdateReservationStatusDto })
  @ApiResponse({ status: 200, description: '예약 상태 업데이트 성공' })
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

  // 예약 가능 시간 관리
  @ApiOperation({
    summary: '예약 가능 시간 관리',
    description: '서비스의 예약 가능 시간을 관리합니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiParam({ name: 'service_id', description: '서비스 ID' })
  @ApiBody({ type: ManageAvailableTimeDto })
  @ApiResponse({ status: 200, description: '예약 가능 시간 설정 성공' })
  @Post('available-time/:service_id')
  manageAvailableTime(
    @Param('business_id') business_id: string,
    @Param('service_id') service_id: string,
    @Body() manageAvailableTimeDto: ManageAvailableTimeDto,
  ) {
    return this.businessReservationsService.manageAvailableTime(
      business_id,
      service_id,
      manageAvailableTimeDto,
    );
  }

  // 예약 가능 시간 조회
  @ApiOperation({
    summary: '예약 가능 시간 조회',
    description: '서비스의 모든 예약 가능 시간을 조회합니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiParam({ name: 'service_id', description: '서비스 ID' })
  @ApiResponse({ status: 200, description: '예약 가능 시간 조회 성공' })
  @Get('available-time/:service_id')
  getAvailableTime(
    @Param('business_id') business_id: string,
    @Param('service_id') service_id: string,
  ) {
    return this.businessReservationsService.getAvailableTime(
      business_id,
      service_id,
    );
  }

  // 특정 날짜의 예약 가능 시간 조회
  @ApiOperation({
    summary: '특정 날짜의 예약 가능 시간 조회',
    description: '특정 날짜의 예약 가능 시간을 조회합니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiParam({ name: 'service_id', description: '서비스 ID' })
  @ApiResponse({ status: 200, description: '예약 가능 시간 조회 성공' })
  @Get('available-time/:service_id/date')
  getAvailableTimeByDate(
    @Param('business_id') business_id: string,
    @Param('service_id') service_id: string,
    @Query('date') date: string,
  ) {
    return this.businessReservationsService.getAvailableTimeByDate(
      business_id,
      service_id,
      date,
    );
  }
}
