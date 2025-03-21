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
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

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

  // 내 예약 목록
  @Get()
  async findMyReservations(@Request() req) {
    const userId = req.user.user_id;
    return this.reservationsService.findUserReservations(userId);
  }

  // 예약 상세 조회
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.user_id;
    return this.reservationsService.findOne(id, userId);
  }

  // 예약 취소
  @Delete(':id')
  async cancel(@Param('id') id: string, @Request() req) {
    const userId = req.user.user_id;
    return this.reservationsService.cancelReservation(id, userId);
  }
}
