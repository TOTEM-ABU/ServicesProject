import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../tools';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async myBrands(userId: string) {
    try {
      const brands = await this.prisma.brand.findMany({
        where: { createdBy: userId },
      });

      if (!brands || brands.length === 0) {
        throw new NotFoundException('You don`t create brands yet!');
      }

      return brands;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get brands!', HttpStatus.NOT_FOUND);
    }
  }

  async mySizes(userId: string) {
    try {
      const sizes = await this.prisma.size.findMany({
        where: { createdBy: userId },
      });

      if (!sizes || sizes.length === 0) {
        throw new NotFoundException('You don`t create sizes yet!');
      }

      return sizes;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get sizes!', HttpStatus.NOT_FOUND);
    }
  }

  async myColors(userId: string) {
    try {
      const colors = await this.prisma.color.findMany({
        where: { createdBy: userId },
      });

      if (!colors || colors.length === 0) {
        throw new NotFoundException('You don`t create colors yet!');
      }

      return colors;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get colors!', HttpStatus.NOT_FOUND);
    }
  }

  async myTools(userId: string) {
    try {
      const tools = await this.prisma.tool.findMany({
        where: { createdBy: userId },
      });

      if (!tools || tools.length === 0) {
        throw new NotFoundException('You don`t create tools yet!');
      }

      return tools;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get tools!', HttpStatus.NOT_FOUND);
    }
  }

  async myProducts(userId: string) {
    try {
      const products = await this.prisma.product.findMany({
        where: { createdBy: userId },
      });

      if (!products || products.length === 0) {
        throw new NotFoundException('You don`t create products yet!');
      }

      return products;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get products!', HttpStatus.NOT_FOUND);
    }
  }

  async myMasters(userId: string) {
    try {
      const masters = await this.prisma.master.findMany({
        where: { createdBy: userId },
      });

      if (!masters || masters.length === 0) {
        throw new NotFoundException('You don`t create masters yet!');
      }

      return masters;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get masters!', HttpStatus.NOT_FOUND);
    }
  }

  async myComments(userId: string) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: { userId: userId },
      });

      if (!comments || comments.length === 0) {
        throw new NotFoundException('You don`t create comments yet!');
      }

      return comments;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get comments!', HttpStatus.NOT_FOUND);
    }
  }

  async myOrders(userId: string) {
    try {
      const orders = await this.prisma.order.findMany({
        where: { userId: userId },
      });

      if (!orders || orders.length === 0) {
        throw new NotFoundException('You don`t create orders yet!');
      }

      return orders;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get orders!', HttpStatus.NOT_FOUND);
    }
  }

  async myStars(userId: string) {
    try {
      const stars = await this.prisma.masterStar.findMany({
        where: { userId: userId },
        include: {
          Master: true,
        },
      });

      if (!stars || stars.length === 0) {
        throw new NotFoundException('You don`t create stars yet!');
      }

      return stars;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get stars!', HttpStatus.NOT_FOUND);
    }
  }

  async myProfile(userId: string) {
    try {
      const me = await this.prisma.user.findFirst({
        where: { id: userId },
        include: { Region: true },
      });

      return me;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get stars!', HttpStatus.NOT_FOUND);
    }
  }
}
