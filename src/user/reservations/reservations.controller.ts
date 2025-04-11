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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@/auth/public.decorator';

@ApiTags('사용자 예약')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({
    summary: '모든 서비스 목록 조회',
    description: '예약 가능한 모든 서비스 목록을 카테고리별로 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '서비스 목록 조회 성공' })
  @Public()
  @Get('/services')
  getAllServices() {
    return this.reservationsService.getAllServices();
  }

  @ApiOperation({
    summary: '서비스별 사업자 목록 조회',
    description: '선택한 서비스를 제공하는 모든 사업자 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'service_id',
    required: true,
    description: '서비스 ID',
  })
  @ApiResponse({
    status: 200,
    description: '서비스 제공 사업자 목록 조회 성공',
  })
  @Public()
  @Get('/services/:service_id/businesses')
  getBusinessesByServiceId(@Param('service_id') service_id: string) {
    return this.reservationsService.getBusinessesByService(service_id);
  }

  @ApiOperation({
    summary: '예약 가능 스케줄 조회',
    description:
      '비즈니스와 서비스의 예약 가능 스케줄을 조회합니다. ' +
      '날짜 형식에 따라 월 단위(YYYY-MM) 또는 일 단위(YYYY-MM-DD) 정보를 반환합니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiParam({ name: 'service_id', description: '서비스 ID' })
  @ApiParam({
    name: 'date',
    description: '날짜 (YYYY-MM: 월 단위, YYYY-MM-DD: 일 단위)',
  })
  @ApiResponse({ status: 200, description: '예약 가능 스케줄 조회 성공' })
  @Public()
  @Get('/businesses/:business_id/services/:service_id/schedules/:date')
  getAvailableSchedule(
    @Param('business_id') business_id: string,
    @Param('service_id') service_id: string,
    @Param('date') date: string,
  ) {
    return this.reservationsService.getAvailableSchedule(
      business_id,
      service_id,
      date,
    );
  }

  @ApiOperation({
    summary: '예약 불가능 날짜 조회 (이전 버전)',
    description:
      '특정 비즈니스와 서비스에 대해 예약 불가능한 날짜를 조회합니다. 새 API로 교체 예정입니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiQuery({ name: 'service_id', description: '서비스 ID' })
  @ApiQuery({
    name: 'date',
    description: '특정 달의 날짜 (YYYY-MM 형식)',
    required: false,
  })
  @ApiResponse({ status: 200, description: '예약 불가능 날짜 조회 성공' })
  @Public()
  @Get('/businesses/:business_id/disabled-dates')
  getDisabledDates(
    @Param('business_id') business_id: string,
    @Query('service_id') service_id: string,
    @Query('date') date?: string,
  ) {
    return this.reservationsService.getDisabledDates(business_id, date);
  }

  @ApiOperation({
    summary: '예약 가능 시간 조회 (이전 버전)',
    description:
      '특정 날짜에 비즈니스와 서비스의 예약 가능 시간을 조회합니다. 새 API로 교체 예정입니다.',
  })
  @ApiParam({ name: 'business_id', description: '비즈니스 ID' })
  @ApiParam({ name: 'service_id', description: '서비스 ID' })
  @ApiParam({ name: 'date', description: '날짜 (YYYY-MM-DD 형식)' })
  @ApiResponse({ status: 200, description: '예약 가능 시간 조회 성공' })
  @Public()
  @Get('/businesses/:business_id/services/:service_id/available-times/:date')
  getAvailableTimesByDate(
    @Param('business_id') business_id: string,
    @Param('service_id') service_id: string,
    @Param('date') date: string,
  ) {
    return this.reservationsService.getAvailableTimesByDate(
      business_id,
      service_id,
      date,
    );
  }

  @ApiOperation({
    summary: '사용자의 반려동물 목록 조회',
    description: '로그인한 사용자의 등록된 반려동물 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '반려동물 목록 조회 성공' })
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @Get('/pets')
  getUserPets(@Req() req: Request) {
    return this.reservationsService.getUserPets(req.user.user_id);
  }

  @ApiOperation({
    summary: '예약 생성',
    description:
      '새로운 예약을 생성합니다. 서비스, 사업자, 반려동물, 시간 정보가 필요합니다.',
  })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: '예약 생성 성공' })
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
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
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @Get('/my-reservations')
  findAll(@Req() req: Request) {
    return this.reservationsService.findAll(req.user.user_id);
  }

  @ApiOperation({
    summary: '예약 상세 조회',
    description: '특정 예약의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'reservation_id', description: '예약 ID' })
  @ApiResponse({ status: 200, description: '예약 상세 조회 성공' })
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @Get('/:reservation_id')
  findOne(
    @Param('reservation_id') reservation_id: string,
    @Req() req: Request,
  ) {
    return this.reservationsService.findOne(reservation_id, req.user.user_id);
  }

  @ApiOperation({
    summary: '예약 수정',
    description:
      '예약 정보를 수정합니다. 시작 시간, 종료 시간, 메모를 수정할 수 있습니다.',
  })
  @ApiParam({ name: 'reservation_id', description: '예약 ID' })
  @ApiBody({ type: UpdateReservationDto })
  @ApiResponse({ status: 200, description: '예약 수정 성공' })
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @Patch('/:reservation_id')
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
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @Delete('/:reservation_id')
  cancel(@Param('reservation_id') reservation_id: string, @Req() req: Request) {
    return this.reservationsService.cancel(reservation_id, req.user.user_id);
  }
}
