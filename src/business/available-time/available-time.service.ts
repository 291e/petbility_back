import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAvailableTimeDto } from './dto/create-available-time.dto';
import { UpdateAvailableTimeDto } from './dto/update-available-time.dto';
import { ScheduleType } from '@prisma/client';

@Injectable()
export class BusinessAvailableTimeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAvailableTimeDto: CreateAvailableTimeDto) {
    const { is_exception, ...data } = createAvailableTimeDto;
    return this.prisma.businessAvailableTime.create({
      data: {
        ...data,
        day_of_week: data.day_of_week.toString(),
        type: is_exception ? ScheduleType.EXCEPTION : ScheduleType.WEEKLY,
      },
    });
  }

  async findAll(business_id: string) {
    return this.prisma.businessAvailableTime.findMany({
      where: { business_id },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });
  }

  async findOne(id: string) {
    const availableTime = await this.prisma.businessAvailableTime.findUnique({
      where: { id },
    });

    if (!availableTime) {
      throw new NotFoundException(`Available time with ID ${id} not found`);
    }

    return availableTime;
  }

  async update(id: string, updateAvailableTimeDto: UpdateAvailableTimeDto) {
    const { is_exception, ...data } = updateAvailableTimeDto;
    try {
      return await this.prisma.businessAvailableTime.update({
        where: { id },
        data: {
          ...data,
          day_of_week: data.day_of_week?.toString(),
          type:
            is_exception !== undefined
              ? is_exception
                ? ScheduleType.EXCEPTION
                : ScheduleType.WEEKLY
              : undefined,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Available time with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.businessAvailableTime.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Available time with ID ${id} not found`);
    }
  }
}
