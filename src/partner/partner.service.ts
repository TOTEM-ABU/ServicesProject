import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import Prisma from '@prisma/client';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PrismaService } from '../tools';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; image: string }) {
    const existingPartner = await this.prisma.partner.findFirst({
      where: { name: data.name },
    });

    if (existingPartner) {
      throw new BadRequestException('Bu nomli partner allaqachon mavjud');
    }
    try {
      const partner = await this.prisma.partner.create({ data });
      return partner;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in create partner!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query: {
    name?: string;
    sort?: 'asc' | 'desc';
    sortBy?: 'name' | 'createdAt';
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        name = '',
        sort = 'asc',
        sortBy = 'name',
        page = 1,
        limit = 10,
      } = query;

      const where = {
        name: {
          contains: name,
        },
      };

      const partners = await this.prisma.partner.findMany({
        where,
        orderBy: { [sortBy]: sort },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await this.prisma.partner.count({ where });

      return {
        data: partners,
        meta: {
          total,
          page,
          limit,
          lastPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get all partners!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findOne(id: string) {
    const existingregion = await this.prisma.partner.findUnique({
      where: { id },
    });

    if (!existingregion) {
      throw new BadRequestException('Bunday partner mavjud emas');
    }

    try {
      const partner = await this.prisma.partner.findUnique({ where: { id } });

      return partner;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get one partner!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async update(id: string, data: UpdatePartnerDto) {
    const existingPartner = await this.prisma.partner.findUnique({
      where: { id },
    });

    if (!existingPartner) {
      throw new BadRequestException('Bunday partner mavjud emas');
    }

    try {
      const updated = await this.prisma.partner.update({
        where: { id },
        data,
      });
      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update partner!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    const existingPartner = await this.prisma.partner.findUnique({
      where: { id },
    });

    if (!existingPartner) {
      throw new BadRequestException('Bunday partner mavjud emas');
    }

    try {
      const deleted = await this.prisma.partner.delete({ where: { id } });
      return deleted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete partner!', HttpStatus.NOT_FOUND);
    }
  }
}
