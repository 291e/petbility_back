// src/reservations/reservations.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Body,
  UseGuards,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('User Reservations')
@Controller('reservations')
@UseGuards(SupabaseAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({
    summary: '예약 생성',
    description: '새로운 예약을 생성합니다.',
  })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: '예약 생성 성공' })
  @Post()
  create(
    @Body() createReservationDto: CreateReservationDto,
    @Req() req: Request,
  ) {
    return this.reservationsService.create(
      req.user.user_id,
      createReservationDto,
    );
  }

  @ApiOperation({
    summary: '예약 목록 조회',
    description: '사용자의 모든 예약을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '예약 목록 조회 성공' })
  @Get()
  findAll(@Req() req: Request) {
    return this.reservationsService.findAll(req.user.user_id);
  }

  @ApiOperation({
    summary: '예약 상세 조회',
    description: '특정 예약의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'reservation_id', description: '예약 ID' })
  @ApiResponse({ status: 200, description: '예약 상세 조회 성공' })
  @Get(':reservation_id')
  findOne(
    @Param('reservation_id') reservation_id: string,
    @Req() req: Request,
  ) {
    return this.reservationsService.findOne(reservation_id, req.user.user_id);
  }

  @ApiOperation({
    summary: '예약 수정',
    description: '예약 정보를 수정합니다.',
  })
  @ApiParam({ name: 'reservation_id', description: '예약 ID' })
  @ApiBody({ type: UpdateReservationDto })
  @ApiResponse({ status: 200, description: '예약 수정 성공' })
  @Patch(':reservation_id')
  update(
    @Param('reservation_id') reservation_id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Req() req: Request,
  ) {
    return this.reservationsService.update(
      reservation_id,
      req.user.user_id,
      updateReservationDto,
    );
  }

  @ApiOperation({ summary: '예약 취소', description: '예약을 취소합니다.' })
  @ApiParam({ name: 'reservation_id', description: '예약 ID' })
  @ApiResponse({ status: 200, description: '예약 취소 성공' })
  @Delete(':reservation_id')
  cancel(@Param('reservation_id') reservation_id: string, @Req() req: Request) {
    return this.reservationsService.cancel(reservation_id, req.user.user_id);
  }

  @ApiOperation({
    summary: '서비스별 비즈니스 조회',
    description: '특정 서비스를 제공하는 비즈니스 목록을 조회합니다.',
  })
  @ApiQuery({ name: 'service_id', description: '서비스 ID' })
  @ApiResponse({ status: 200, description: '비즈니스 목록 조회 성공' })
  @Get('/available-time/businesses')
  getBusinessesByService(@Query('service_id') service_id: string) {
    return this.reservationsService.getBusinessesByService(service_id);
  }

  @ApiOperation({
    summary: '예약 가능 시간 조회',
    description: '특정 비즈니스와 서비스의 예약 가능 시간을 조회합니다.',
  })
  @ApiQuery({ name: 'business_id', description: '비즈니스 ID' })
  @ApiQuery({ name: 'service_id', description: '서비스 ID' })
  @ApiQuery({ name: 'date', description: '날짜 (YYYY-MM-DD 형식)' })
  @ApiResponse({ status: 200, description: '예약 가능 시간 조회 성공' })
  @Get('/available-time/available-times')
  getAvailableTimes(
    @Query('business_id') business_id: string,
    @Query('service_id') service_id: string,
    @Query('date') date: string,
  ) {
    return this.reservationsService.getAvailableTimesByDate(
      business_id,
      service_id,
      date,
    );
  }

  @ApiOperation({
    summary: '예약 가능 시간 조회 (서비스 ID)',
    description: '특정 서비스의 예약 가능 시간을 조회합니다.',
  })
  @ApiParam({ name: 'service_id', description: '서비스 ID' })
  @ApiQuery({ name: 'business_id', description: '비즈니스 ID' })
  @ApiQuery({ name: 'date', description: '날짜 (YYYY-MM-DD 형식)' })
  @ApiResponse({ status: 200, description: '예약 가능 시간 조회 성공' })
  @Get('available-times/:service_id')
  getAvailableTimesByDate(
    @Param('service_id') service_id: string,
    @Query('business_id') business_id: string,
    @Query('date') date: string,
  ) {
    return this.reservationsService.getAvailableTimesByDate(
      business_id,
      service_id,
      date,
    );
  }

  @ApiOperation({
    summary: '예약 불가능 날짜 조회',
    description: '특정 서비스의 예약 불가능한 날짜를 조회합니다.',
  })
  @ApiParam({ name: 'service_id', description: '서비스 ID' })
  @ApiResponse({ status: 200, description: '예약 불가능 날짜 조회 성공' })
  @Get('disabled-dates/:service_id')
  getDisabledDates(@Param('service_id') service_id: string) {
    return this.reservationsService.getDisabledDates(service_id);
  }
}
