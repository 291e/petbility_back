// src/services/services.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('BUSINESS')
  create(@Request() req, @Body() dto: CreateServiceDto) {
    const businessId = req.user.user_id;
    return this.servicesService.createService(dto, businessId);
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

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

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('BUSINESS')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateServiceDto,
  ) {
    const businessId = req.user.user_id;
    return this.servicesService.updateService(id, dto, businessId);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('BUSINESS')
  remove(@Param('id') id: string, @Request() req) {
    const businessId = req.user.user_id;
    return this.servicesService.deleteService(id, businessId);
  }
}
