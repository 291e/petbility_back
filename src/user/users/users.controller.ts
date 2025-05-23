import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Req,
  UseGuards,
  Query,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@/auth/auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '사용자 회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.usersService.signUp(createUserDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getMyProfile(@Req() req: Request) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiResponse({ status: 200, description: '프로필 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  updateMe(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.id, updateUserDto);
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '내 계정 삭제' })
  @ApiResponse({ status: 204, description: '계정 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '삭제 권한 없음' })
  deleteMe(@Req() req: Request) {
    return this.usersService.deleteUser(req.user.id);
  }

  @Post('upgrade-to-business')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사업자 계정으로 업그레이드' })
  @ApiResponse({ status: 200, description: '업그레이드 성공' })
  @ApiResponse({ status: 400, description: '이미 사업자 계정' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  upgradeToBusiness(@Req() req: Request) {
    return this.usersService.upgradeToBusiness(req.user.id);
  }

  @Get('search')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 검색' })
  @ApiQuery({ name: 'query', required: true, description: '검색어' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수' })
  @ApiResponse({ status: 200, description: '검색 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  searchUsers(
    @Query('query') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || query.trim() === '') {
      throw new BadRequestException('검색어를 입력해주세요.');
    }

    return this.usersService.searchUsers(
      query,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}
