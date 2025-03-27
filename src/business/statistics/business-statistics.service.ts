import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';
import { startOfMonth } from 'date-fns';

interface FilterOptions {
  from?: string;
  to?: string;
  sort?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable()
export class BusinessStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(businessId: string) {
    const [
      totalServices,
      totalReservations,
      statusCounts,
      revenue,
      reservations,
    ] = await Promise.all([
      this.prisma.service.count({
        where: { business_id: businessId, is_deleted: false },
      }),
      this.prisma.reservation.count({
        where: { business_id: businessId },
      }),
      this.prisma.reservation.groupBy({
        by: ['status'],
        where: { business_id: businessId },
        _count: true,
      }),
      this.prisma.reservation.aggregate({
        where: {
          business_id: businessId,
          status: ReservationStatus.COMPLETED,
        },
        _sum: { price: true },
      }),
      this.prisma.reservation.findMany({
        where: { business_id: businessId },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          pet: true,
          service: true,
        },
      }),
    ]);

    const reservationsByStatus = statusCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalServices,
      totalReservations,
      reservationsByStatus,
      totalRevenue: revenue._sum.price || 0,
      recentReservations: reservations,
    };
  }

  async getFilteredReservations(businessId: string, options: FilterOptions) {
    const { from, to, sort = 'desc', page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      business_id: businessId,
    };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [total, reservations] = await Promise.all([
      this.prisma.reservation.count({ where }),
      this.prisma.reservation.findMany({
        where,
        orderBy: [{ date: sort }, { time: sort }],
        skip,
        take: limit,
        include: {
          pet: true,
          service: true,
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      reservations,
    };
  }
}
