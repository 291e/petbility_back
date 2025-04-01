// src/services/dto/service-response.dto.ts

import { ServiceCategory } from '@prisma/client';

export class ServiceResponseDto {
  service_id: string;
  name: string;
  description: string;
  price: number;
  category: ServiceCategory;
  created_at: Date;
  updated_at: Date;
}
