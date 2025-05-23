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
import { AuthGuard } from '@/auth/auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Public } from '@/auth/public.decorator';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('관리자 서비스')
@ApiBearerAuth()
@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly adminServicesService: AdminServicesService) {}

  @ApiOperation({
    summary: '서비스 생성',
    description: '새로운 서비스를 등록합니다.',
  })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({
    status: 201,
    description: '서비스가 성공적으로 생성되었습니다.',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateServiceDto, @Req() req: Request) {
    const adminId = req.user!.id;
    return this.adminServicesService.create(dto, adminId);
  }

  @ApiOperation({
    summary: '모든 서비스 조회',
    description: '등록된 모든 서비스를 조회합니다. 누구나 접근 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '서비스 목록이 성공적으로 반환되었습니다.',
  })
  @Public()
  @Get()
  findAll() {
    return this.adminServicesService.findAll();
  }

  @ApiOperation({
    summary: '단일 서비스 조회',
    description: '특정 ID의 서비스를 조회합니다. 누구나 접근 가능합니다.',
  })
  @ApiParam({ name: 'id', description: '서비스 ID' })
  @ApiResponse({
    status: 200,
    description: '서비스가 성공적으로 반환되었습니다.',
  })
  @ApiResponse({ status: 404, description: '서비스를 찾을 수 없습니다.' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminServicesService.findOne(id);
  }

  @ApiOperation({
    summary: '서비스 수정',
    description: '특정 ID의 서비스 정보를 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '서비스 ID' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({
    status: 200,
    description: '서비스가 성공적으로 수정되었습니다.',
  })
  @ApiResponse({ status: 404, description: '서비스를 찾을 수 없습니다.' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.adminServicesService.update(id, dto);
  }

  @ApiOperation({
    summary: '서비스 삭제',
    description: '특정 ID의 서비스를 삭제합니다.',
  })
  @ApiParam({ name: 'id', description: '서비스 ID' })
  @ApiResponse({
    status: 200,
    description: '서비스가 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({ status: 404, description: '서비스를 찾을 수 없습니다.' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminServicesService.remove(id);
  }
}
