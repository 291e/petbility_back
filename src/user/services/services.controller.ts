import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // 🔍 전체 or 필터된 서비스 목록 조회
  @Get()
  findFilteredServices(
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('sort') sort?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.servicesService.findFilteredServices({
      category,
      location,
      sort,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  // 🔍 단일 서비스 상세 조회
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
}
