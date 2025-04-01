// src/business/reservations/business-reservations.controller.ts

import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BusinessReservationsService } from './business-reservations.service';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { Request } from 'express';

@Controller('business/reservations')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class BusinessReservationsController {
  constructor(
    private readonly businessReservationsService: BusinessReservationsService,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    const businessId = req.user.id;
    return this.businessReservationsService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const businessId = req.user.id;
    return this.businessReservationsService.findOne(id, businessId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
    @Req() req: Request,
  ) {
    const businessId = req.user.id;
    return this.businessReservationsService.updateStatus(id, businessId, dto);
  }
}
