import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { PrismaService } from '../tools';

@Injectable()
export class RegionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRegionDto) {
    const existingRegion = await this.prisma.region.findFirst({
      where: { name_uz: data.name_uz },
    });

    if (existingRegion) {
      throw new BadRequestException('Bu nomli region allaqachon mavjud');
    }

    try {
      const region = await this.prisma.region.create({ data });
      return region;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Region yaratishda xatolik yuz berdi',
        HttpStatus.BAD_REQUEST,
      );
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

      const where = search
        ? {
            OR: [
              {
                name_uz: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                name_ru: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                name_en: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {};

      const regions = await this.prisma.region.findMany({
        where,
        orderBy: {
          [sortBy]: sort,
        },
        skip,
        take,
      });

      const total = await this.prisma.region.count({ where });

      return {
        data: regions,
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
      throw new BadRequestException('Regions not exists yet!');
    }
  }

  async findOne(id: string) {
    const exists = await this.prisma.region.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Region topilmadi', HttpStatus.NOT_FOUND);
    }

    try {
      const region = await this.prisma.region.findUnique({
        where: { id },
      });

      return region;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Regionni olishda xatolik',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, data: UpdateRegionDto) {
    const exists = await this.prisma.region.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Region topilmadi', HttpStatus.NOT_FOUND);
    }
    try {
      const updated = await this.prisma.region.update({
        where: { id },
        data,
      });

      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Regionni yangilashda xatolik',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: string) {
    const exists = await this.prisma.region.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Region topilmadi', HttpStatus.NOT_FOUND);
    }
    try {
      const deleted = await this.prisma.region.delete({
        where: { id },
      });

      return deleted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Regionni o‘chirishda xatolik',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
