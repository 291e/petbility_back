import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class BusinessServicesService {
  constructor(private prisma: PrismaService) {}

  // ✅ 내 서비스 목록 조회
  async getServicesByBusiness(businessId: string) {
    return this.prisma.service.findMany({
      where: {
        business_id: businessId,
        is_deleted: false,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // ✅ 서비스 등록
  async createService(dto: CreateServiceDto, businessId: string) {
    return this.prisma.service.create({
      data: {
        ...dto,
        business_id: businessId,
      },
    });
  }

  // ✅ 서비스 수정
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

  // ✅ 서비스 삭제 (is_deleted로 soft delete)
  async deleteService(serviceId: string, businessId: string) {
    const service = await this.prisma.service.findUnique({
      where: { service_id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('서비스를 찾을 수 없습니다.');
    }

    if (service.business_id !== businessId) {
      throw new ForbiddenException('본인의 서비스만 삭제할 수 있습니다.');
    }

    return this.prisma.service.update({
      where: { service_id: serviceId },
      data: { is_deleted: true },
    });
  }
}
