import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { PrismaService } from '../tools';

@Injectable()
export class ColorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateColorDto, userId: string) {
    const existingColor = await this.prisma.color.findFirst({
      where: {
        name_uz: data.name_uz,
        name_ru: data.name_ru,
        name_en: data.name_en,
      },
    });

    if (existingColor) {
      throw new HttpException(
        'Bu rang allaqachon mavjud',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const color = await this.prisma.color.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });

      return color;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in create color!', HttpStatus.BAD_REQUEST);
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
        sortBy = 'name',
        page = 1,
        limit = 10,
      } = query;

      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const colors = await this.prisma.color.findMany({
        where: {
          name_uz: {
            contains: search,
          },
          name_ru: {
            contains: search,
          },
          name_en: {
            contains: search,
          },
        },
        include: {
          createdByUser: {
            select: {
              firstName: true,
              role: true,
            },
          },
        },
        orderBy: sortBy === 'name' ? { name_uz: sort } : undefined,
        skip,
        take,
      });

      const total = await this.prisma.color.count({
        where: {
          name_uz: {
            contains: search,
          },
          name_ru: {
            contains: search,
          },
          name_en: {
            contains: search,
          },
        },
      });

      return {
        data: colors,
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
      throw new HttpException('Error in get all colors!', HttpStatus.NOT_FOUND);
    }
  }

  async findOne(id: string) {
    const exists = await this.prisma.color.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Color topilmadi!', HttpStatus.NOT_FOUND);
    }

    try {
      const color = await this.prisma.color.findUnique({
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

      return color;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get one color!', HttpStatus.NOT_FOUND);
    }
  }

  async update(id: string, data: UpdateColorDto) {
    const exists = await this.prisma.color.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Color topilmadi!', HttpStatus.NOT_FOUND);
    }

    try {
      const updated = await this.prisma.color.update({
        where: { id },
        data,
      });

      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update color!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    const exists = await this.prisma.color.findFirst({ where: { id } });

    if (!exists) {
      throw new HttpException('Color topilmadi!', HttpStatus.NOT_FOUND);
    }

    try {
      const deleted = await this.prisma.color.delete({
        where: { id },
      });

      return deleted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete color!', HttpStatus.NOT_FOUND);
    }
  }
}
