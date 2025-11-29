import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { PrismaService } from '../tools';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFaqDto) {
    try {
      const faq = await this.prisma.fAQ.create({ data });
      return faq;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in create FAQ!', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(query: {
    question?: string;
    answer?: string;
    sortBy?: string;
    sort?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        question = '',
        answer = '',
        sortBy = 'createdAt',
        sort = 'asc',
        page = 1,
        limit = 10,
      } = query;

      const where: any = {
        question: { contains: question, mode: 'insensitive' },
        answer: { contains: answer, mode: 'insensitive' },
      };

      const faqs = await this.prisma.fAQ.findMany({
        where,
        orderBy: { [sortBy]: sort },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await this.prisma.fAQ.count({ where });

      return {
        data: faqs,
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
      throw new HttpException('Error in get all FAQs!', HttpStatus.NOT_FOUND);
    }
  }

  async findOne(id: string) {
    try {
      const faq = await this.prisma.fAQ.findUnique({ where: { id } });

      if (!faq) {
        throw new HttpException('FAQ topilmadi', HttpStatus.NOT_FOUND);
      }

      return faq;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get one FAQ!', HttpStatus.NOT_FOUND);
    }
  }

  async update(id: string, data: UpdateFaqDto) {
    try {
      const updated = await this.prisma.fAQ.update({
        where: { id },
        data,
      });
      if (!updated) {
        throw new NotFoundException('faq not found!');
      }
      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update FAQ!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.fAQ.delete({
        where: { id },
      });
      if (!deleted) {
        throw new NotFoundException('faq not found!');
      }
      return deleted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete FAQ!', HttpStatus.NOT_FOUND);
    }
  }
}
