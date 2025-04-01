// src/admin/services/admin-services.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class AdminServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceDto, adminId: string) {
    return this.prisma.service.create({
      data: {
        ...dto,
        admin_id: adminId,
      },
    });
  }

  async findAll() {
    return this.prisma.service.findMany();
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { service_id: id },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({
      where: { service_id: id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.service.delete({
      where: { service_id: id },
    });
  }
}
