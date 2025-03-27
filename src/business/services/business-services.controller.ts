import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BusinessServicesService } from './business-services.service';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('business/services')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class BusinessServicesController {
  constructor(
    private readonly businessServicesService: BusinessServicesService,
  ) {}

  // ✅ 내 서비스 목록
  @Get()
  async getMyServices(@Request() req) {
    const businessId = req.user.user_id;
    return this.businessServicesService.getServicesByBusiness(businessId);
  }

  // ✅ 서비스 등록
  @Post()
  async create(@Request() req, @Body() dto: CreateServiceDto) {
    const businessId = req.user.user_id;
    return this.businessServicesService.createService(dto, businessId);
  }

  // ✅ 서비스 수정
  @Patch(':id')
  async update(
    @Param('id') serviceId: string,
    @Request() req,
    @Body() dto: UpdateServiceDto,
  ) {
    const businessId = req.user.user_id;
    return this.businessServicesService.updateService(
      serviceId,
      dto,
      businessId,
    );
  }

  // ✅ 서비스 삭제
  @Delete(':id')
  async remove(@Param('id') serviceId: string, @Request() req) {
    const businessId = req.user.user_id;
    return this.businessServicesService.deleteService(serviceId, businessId);
  }
}
