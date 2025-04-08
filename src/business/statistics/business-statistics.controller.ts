// import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
// import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
// import { RolesGuard } from '@/auth/roles.guard';
// import { Roles } from '@/auth/decorators/roles.decorator';
// import { BusinessStatisticsService } from './business-statistics.service';

// @Controller('business/statistics')
// @UseGuards(SupabaseAuthGuard, RolesGuard)
// @Roles('BUSINESS')
// export class BusinessStatisticsController {
//   constructor(private readonly statsService: BusinessStatisticsService) {}

//   @Get()
//   async getMyStats(@Request() req) {
//     const businessId = req.user.user_id;
//     return this.statsService.getStatistics(businessId);
//   }

//   @Get('reservations')
//   async getFilteredReservations(
//     @Request() req,
//     @Query('from') from?: string,
//     @Query('to') to?: string,
//     @Query('sort') sort: 'asc' | 'desc' = 'desc',
//     @Query('page') page = '1',
//     @Query('limit') limit = '10',
//   ) {
//     const businessId = req.user.user_id;
//     return this.statsService.getFilteredReservations(businessId, {
//       from,
//       to,
//       sort,
//       page: parseInt(page),
//       limit: parseInt(limit),
//     });
//   }
// }
