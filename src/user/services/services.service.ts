import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔍 단일 서비스 조회
  async findOne(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId, is_deleted: false },
    });

    if (!service) {
      throw new NotFoundException('해당 서비스가 존재하지 않습니다');
    }
    return service;
  }

  // 🔍 필터 기반 서비스 목록 조회
  async findFilteredServices(params: {
    category?: string;
    location?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const { category, location, sort, page = 1, limit = 10 } = params;

    const where: any = {
      is_deleted: false,
    };

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    let orderBy: any = { created_at: 'desc' };

    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { avg_rating: 'desc' };
        break;
      case 'likes':
        orderBy = { likes: 'desc' };
        break;
    }

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      total,
      page,
      limit,
      services,
      totalPages: Math.ceil(total / limit),
    };
  }
}
