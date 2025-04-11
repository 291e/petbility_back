import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateServiceStatusDto {
  @ApiProperty({
    description: '서비스 상태 (active 또는 inactive)',
    example: 'active',
  })
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}
