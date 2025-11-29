import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import Prisma from '@prisma/client';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { PrismaService } from '../tools';

@Injectable()
export class SizeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSizeDto, userId: string) {
    const existingSize = await this.prisma.size.findFirst({
      where: { name_uz: data.name_uz },
    });

    if (existingSize) {
      throw new BadRequestException('Bu nomli o‘lcham allaqachon mavjud');
    }

    try {
      const size = await this.prisma.size.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      return size;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error in create tool!');
    }
  }

  async findAll(query: {
    search?: string;
    sort?: 'asc' | 'desc';
    sortBy?: 'name_uz' | 'name_ru' | 'name_en';
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        search = '',
        sort = 'asc',
        sortBy = 'name_uz',
        page = 1,
        limit = 10,
      } = query;

      const take = Number(limit);
      const skip = (Number(page) - 1) * take;
      const whereClause = search
        ? {
            OR: [
              {
                name_uz: {
                  contains: search,
                },
              },
              {
                name_ru: {
                  contains: search,
                },
              },
              {
                name_en: {
                  contains: search,
                },
              },
            ],
          }
        : {};

      const sizes = await this.prisma.size.findMany({
        where: whereClause,
        include: {
          createdByUser: {
            select: {
              firstName: true,
              role: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sort,
        },
        skip,
        take,
      });

      const total = await this.prisma.size.count({
        where: whereClause,
      });

      return {
        data: sizes,
        meta: {
          total,
          page: Number(page),
          limit: take,
          lastPage: Math.ceil(total / take),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error in get all sizes!');
    }
  }

  async findOne(id: string) {
    const exists = await this.prisma.size.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Size topilmadi', HttpStatus.NOT_FOUND);
    }

    try {
      const size = await this.prisma.size.findUnique({
        where: { id },
        include: {
          createdByUser: {
            select: {
              firstName: true,
              role: true,
            },
          },
        },
      });

      return size;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error in get one size!');
    }
  }

  async update(id: string, data: UpdateSizeDto) {
    const exists = await this.prisma.size.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Size topilmadi', HttpStatus.NOT_FOUND);
    }

    try {
      const updated = await this.prisma.size.update({
        where: { id },
        data,
      });

      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error in update size!');
    }
  }

  async remove(id: string) {
    const exists = await this.prisma.size.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Size topilmadi', HttpStatus.NOT_FOUND);
    }

    try {
      const deleted = await this.prisma.size.delete({
        where: { id },
      });

      return deleted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error in delete size!');
    }
  }
}
