import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminServicesService } from './admin-services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Request } from 'express';

@Controller('admin/services')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminServicesController {
  constructor(private readonly adminServicesService: AdminServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto, @Req() req: Request) {
    const adminId = req.user!.id;
    return this.adminServicesService.create(dto, adminId);
  }

  @Get()
  findAll() {
    return this.adminServicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminServicesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.adminServicesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminServicesService.remove(id);
  }
}
