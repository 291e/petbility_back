// src/reservations/reservations.controller.ts

import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { Request } from 'express';

@Controller('reservations')
@UseGuards(SupabaseAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateReservationDto) {
    const userId = req.user.id;
    return this.reservationsService.create(dto, userId);
  }

  @Get('me')
  findMyReservations(@Req() req: Request) {
    const userId = req.user.id;
    return this.reservationsService.findMyReservations(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user.id;
    return this.reservationsService.findOne(id, userId);
  }
}
