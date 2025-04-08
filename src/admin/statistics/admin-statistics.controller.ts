// // src/admin/statistics/admin-statistics.controller.ts
// import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
// import { AdminStatisticsService } from './admin-statistics.service';
// import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
// import { RolesGuard } from '@/auth/roles.guard';
// import { Roles } from '@/auth/decorators/roles.decorator';

// @Controller('admin/statistics')
// @UseGuards(SupabaseAuthGuard, RolesGuard)
// @Roles('ADMIN')
// export class AdminStatisticsController {
//   constructor(private readonly statsService: AdminStatisticsService) {}

//   // 플랫폼 통계
//   @Get()
//   async getPlatformStats() {
//     return this.statsService.getAdminStatistics();
//   }

//   // 최근 가입자
//   @Get('recent-users')
//   async getRecentUsers(
//     @Query('period') period?: string,
//     @Query('from') from?: string,
//     @Query('to') to?: string,
//     @Query('sort') sort: 'asc' | 'desc' = 'desc',
//     @Query('page') page = '1',
//     @Query('limit') limit = '5',
//   ) {
//     return this.statsService.getRecentUsers({
//       period,
//       from,
//       to,
//       sort,
//       page: parseInt(page),
//       limit: parseInt(limit),
//     });
//   }

//   // 최근 예약 목록
//   @Get('recent-reservations')
//   async getRecentReservations(
//     @Query('period') period?: string,
//     @Query('from') from?: string,
//     @Query('to') to?: string,
//     @Query('sort') sort: 'asc' | 'desc' = 'desc',
//     @Query('page') page = '1',
//     @Query('limit') limit = '5',
//   ) {
//     return this.statsService.getRecentReservations({
//       period,
//       from,
//       to,
//       sort,
//       page: parseInt(page),
//       limit: parseInt(limit),
//     });
//   }

//   // 유저 상세 조회 (예약 및 서비스 포함)
//   @Get('user/:id')
//   async getUserDetail(@Param('id') userId: string) {
//     return this.statsService.findUserById(userId);
//   }
// }
