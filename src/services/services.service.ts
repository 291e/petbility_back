// src/services/services.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // 서비스 등록
  async createService(dto: CreateServiceDto, businessId: string) {
    return this.prisma.service.create({
      data: {
        ...dto,
        business_id: businessId,
      },
    });
  }

  // 전체 서비스 목록 조회 (홈 / 사용자용)
  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // 단일 서비스 상세 조회
  async findOne(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { service_id: serviceId },
    });

    if (!service)
      throw new NotFoundException('해당 서비스가 존재하지 않습니다');
    return service;
  }

  // 서비스 수정 (본인만 가능)
  async updateService(
    serviceId: string,
    dto: UpdateServiceDto,
    businessId: string,
  ) {
    const service = await this.prisma.service.findUnique({
      where: { service_id: serviceId },
    });
    if (!service || service.business_id !== businessId) {
      throw new ForbiddenException('해당 서비스에 대한 수정 권한이 없습니다');
    }

    return this.prisma.service.update({
      where: { service_id: serviceId },
      data: { ...dto },
    });
  }

  // 서비스 삭제 (본인만 가능)
  async deleteService(serviceId: string, businessId: string) {
    const service = await this.prisma.service.findUnique({
      where: { service_id: serviceId },
    });
    if (!service || service.business_id !== businessId) {
      throw new ForbiddenException('해당 서비스에 대한 삭제 권한이 없습니다');
    }

    return this.prisma.service.delete({ where: { service_id: serviceId } });
  }

  // 서비스 필터링
  async findFilteredServices(params: {
    category?: string;
    location?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const { category, location, sort, page = 1, limit = 10 } = params;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    let orderBy: any = { created_at: 'desc' }; // 기본 정렬: 최신순

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
