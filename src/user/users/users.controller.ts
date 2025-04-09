import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Request,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SupabaseService } from '@/auth/supabase/supabase.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async signUp(@Body() userData: CreateUserDto) {
    return this.usersService.signUp(userData);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getMe(@Request() req) {
    return this.usersService.getUserById(req.user.user_id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: '내 정보 수정' })
  @ApiResponse({ status: 200, description: '내 정보 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async updateMe(@Request() req, @Body() updateData: UpdateUserDto) {
    return this.usersService.updateUser(req.user.user_id, updateData);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async deleteMe(@Request() req) {
    return this.usersService.deleteUser(req.user.user_id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch('upgrade')
  @ApiOperation({ summary: '사업자 계정으로 업그레이드' })
  @ApiResponse({ status: 200, description: '업그레이드 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async upgradeToBusiness(@Request() req) {
    return this.usersService.upgradeToBusiness(req.user.user_id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('search')
  @ApiOperation({ summary: '사용자 검색' })
  @ApiQuery({ name: 'query', required: true, description: '검색어' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수' })
  @ApiResponse({ status: 200, description: '검색 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  async searchUsers(
    @Query('query') query: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.usersService.searchUsers(
      query,
      parseInt(page),
      parseInt(limit),
    );
  }
}
