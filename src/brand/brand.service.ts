import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PrismaService } from '../tools';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBrandDto, userId: string) {
    const existingBrand = await this.prisma.brand.findFirst({
      where: {
        name_uz: data.name_uz,
        name_ru: data.name_ru,
        name_en: data.name_en,
      },
    });

    if (existingBrand) {
      throw new BadRequestException('Bu brend allaqachon mavjud');
    }

    try {
      const brand = await this.prisma.brand.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });

      return brand;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in create brand!', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(query: {
    search?: string;
    sort?: 'asc' | 'desc';
    sortBy?: 'name_uz' | 'name_ru' | 'name_en' | 'createdAt';
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

      const where = {
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
      };

      const brands = await this.prisma.brand.findMany({
        where,
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

      const total = await this.prisma.brand.count({ where });

      return {
        data: brands,
        meta: {
          total,
          page: Number(page),
          limit: take,
          lastPage: Math.ceil(total / take),
        },
      };
    } catch (error) {
      console.error(error);
      throw new HttpException('Error in get all brands!', HttpStatus.NOT_FOUND);
    }
  }

  async findOne(id: string) {
    const exists = await this.prisma.brand.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Brand topilmadi', HttpStatus.NOT_FOUND);
    }
    try {
      const brand = await this.prisma.brand.findUnique({
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

      return brand;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get one brand!', HttpStatus.NOT_FOUND);
    }
  }

  async update(id: string, data: UpdateBrandDto) {
    const exists = await this.prisma.brand.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Brand topilmadi', HttpStatus.NOT_FOUND);
    }

    try {
      const updated = await this.prisma.brand.update({
        where: { id },
        data,
      });

      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update brand!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    const exists = await this.prisma.brand.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Brand topilmadi', HttpStatus.NOT_FOUND);
    }

    try {
      const deleted = await this.prisma.brand.delete({
        where: { id },
      });

      return deleted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete brand!', HttpStatus.NOT_FOUND);
    }
  }
}
