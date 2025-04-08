// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from 'prisma/prisma.service';
// import { ReservationStatus } from '@prisma/client';
// import { getDateRangeByPeriod } from '@/utils/date-range';
// import { startOfMonth } from 'date-fns';

// interface StatsFilterOptions {
//   period?: string;
//   from?: string;
//   to?: string;
//   sort?: 'asc' | 'desc';
//   page?: number;
//   limit?: number;
// }

// @Injectable()
// export class AdminStatisticsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async getAdminStatistics() {
//     const [
//       totalUsers,
//       totalBusinesses,
//       totalServices,
//       totalReservations,
//       statusCounts,
//       revenue,
//       newUsersThisMonth,
//     ] = await Promise.all([
//       this.prisma.user.count(),
//       this.prisma.user.count({ where: { role: 'BUSINESS' } }),
//       this.prisma.service.count({ where: { is_deleted: false } }),
//       this.prisma.reservation.count(),
//       this.prisma.reservation.groupBy({
//         by: ['status'],
//         _count: true,
//       }),
//       this.prisma.reservation.aggregate({
//         where: { status: ReservationStatus.COMPLETED },
//         _sum: { price: true },
//       }),
//       this.prisma.user.count({
//         where: {
//           createdAt: { gte: startOfMonth(new Date()) },
//         },
//       }),
//     ]);

//     const reservationsByStatus = statusCounts.reduce(
//       (acc, curr) => {
//         acc[curr.status] = curr._count;
//         return acc;
//       },
//       {} as Record<string, number>,
//     );

//     return {
//       totalUsers,
//       totalBusinesses,
//       totalServices,
//       totalReservations,
//       reservationsByStatus,
//       totalRevenue: revenue._sum.price || 0,
//       newUsersThisMonth,
//     };
//   }

//   async getRecentUsers(options: StatsFilterOptions) {
//     const { period, from, to, sort = 'desc', page = 1, limit = 5 } = options;

//     let dateFilter: any = {};

//     if (from && to) {
//       dateFilter.createdAt = {
//         gte: new Date(from),
//         lte: new Date(to),
//       };
//     } else if (period) {
//       const range = getDateRangeByPeriod(period);
//       if (range) {
//         dateFilter.createdAt = {
//           gte: range.from,
//           lte: range.to,
//         };
//       }
//     }

//     const skip = (page - 1) * limit;

//     const [users, total] = await Promise.all([
//       this.prisma.user.findMany({
//         where: dateFilter,
//         orderBy: { createdAt: sort },
//         skip,
//         take: limit,
//         select: {
//           name: true,
//           email: true,
//           createdAt: true,
//           role: true,
//         },
//       }),
//       this.prisma.user.count({ where: dateFilter }),
//     ]);

//     return {
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       users,
//     };
//   }

//   async getRecentReservations(options: StatsFilterOptions) {
//     const { period, from, to, sort = 'desc', page = 1, limit = 5 } = options;

//     let dateFilter: any = {};

//     if (from && to) {
//       dateFilter.created_at = {
//         gte: new Date(from),
//         lte: new Date(to),
//       };
//     } else if (period) {
//       const range = getDateRangeByPeriod(period);
//       if (range) {
//         dateFilter.created_at = {
//           gte: range.from,
//           lte: range.to,
//         };
//       }
//     }

//     const skip = (page - 1) * limit;

//     const [reservations, total] = await Promise.all([
//       this.prisma.reservation.findMany({
//         where: dateFilter,
//         orderBy: { created_at: sort },
//         skip,
//         take: limit,
//         include: {
//           user: true,
//           service: true,
//           pet: true,
//         },
//       }),
//       this.prisma.reservation.count({ where: dateFilter }),
//     ]);

//     return {
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       reservations,
//     };
//   }

//   async findUserById(userId: string) {
//     const user = await this.prisma.user.findUnique({
//       where: { user_id: userId },
//       include: {
//         reservations: {
//           include: {
//             service: true,
//             pet: true,
//           },
//           orderBy: { date: 'desc' },
//         },
//         services: {
//           where: { is_deleted: false },
//           orderBy: { created_at: 'desc' },
//         },
//       },
//     });

//     if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

//     return user;
//   }
// }
