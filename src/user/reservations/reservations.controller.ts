// src/reservations/reservations.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { ReservationStatus } from '@prisma/client';

@Controller('reservations')
@UseGuards(SupabaseAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // 예약 생성
  @Post()
  async create(@Request() req, @Body() dto: CreateReservationDto) {
    const userId = req.user.user_id;
    return this.reservationsService.createReservation(userId, dto);
  }

  // // 예약 상태 변경
  // @UseGuards(SupabaseAuthGuard, RolesGuard)
  // @Roles('BUSINESS')
  // @Patch(':id/status')
  // async updateStatus(
  //   @Param('id') reservationId: string,
  //   @Body('status') status: ReservationStatus,
  //   @Request() req,
  // ) {
  //   const businessId = req.user.user_id;
  //   return this.reservationsService.updateReservationStatus(
  //     reservationId,
  //     status,
  //     businessId,
  //   );
  // }

  // 내 예약 목록
  @UseGuards(SupabaseAuthGuard)
  @Get()
  async getMyReservations(
    @Request() req,
    @Query('status') status?: ReservationStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '15',
  ) {
    const userId = req.user.user_id;
    return this.reservationsService.findUserReservations(userId, {
      status,
      from,
      to,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  // 예약 상세 조회
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.user_id;
    return this.reservationsService.findOne(id, userId);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id/cancel')
  async cancelReservation(@Param('id') reservationId: string, @Request() req) {
    const userId = req.user.user_id;
    return this.reservationsService.cancelReservation(reservationId, userId);
  }
}
