import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../tools';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCommentDto, userId: string) {
    try {
      const comment = await this.prisma.comment.create({
        data: { ...data, userId },
      });
      if (!comment) {
        throw new BadRequestException('Comment not created!');
      }
      return comment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in create comment!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query: {
    orderId?: string;
    sortBy?: string;
    sort?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      orderId,
      sortBy = 'createdAt',
      sort = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const where: any = {};
    if (orderId) {
      where.orderId = orderId;
    }

    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        include: {
          Order: {
            include: {
              orderTools: {
                include: {
                  Tool: true,
                },
              },
              orderProducts: {
                include: {
                  Product: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sort,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          Order: {
            include: {
              orderTools: {
                include: {
                  Tool: true,
                },
              },
              orderProducts: {
                include: {
                  Product: true,
                },
              },
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found!');
      }

      return comment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get one comment!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async update(id: string, data: UpdateCommentDto) {
    try {
      const comment = await this.prisma.comment.update({
        where: { id },
        data,
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      return comment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update comment!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    try {
      const comment = await this.prisma.comment.delete({
        where: { id },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      return comment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete comment!', HttpStatus.NOT_FOUND);
    }
  }
}
