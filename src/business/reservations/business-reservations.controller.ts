import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { BusinessReservationsService } from './business-reservations.service';
import { ReservationStatus } from '@prisma/client';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

@Controller('business/reservations')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class BusinessReservationsController {
  constructor(
    private readonly businessReservationsService: BusinessReservationsService,
  ) {}

  @Get()
  async getBusinessReservations(
    @Request() req,
    @Query('status') status?: ReservationStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '15',
  ) {
    const businessId = req.user.user_id;
    return this.businessReservationsService.findReservationsByBusiness(
      businessId,
      {
        status,
        from,
        to,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    );
  }

  @Patch(':id/status')
  async updateReservationStatus(
    @Param('id') reservationId: string,
    @Request() req,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    const businessId = req.user.user_id;
    return this.businessReservationsService.updateStatus(
      reservationId,
      businessId,
      dto.status,
    );
  }
}
