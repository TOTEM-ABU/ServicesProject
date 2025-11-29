import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../tools';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const session = await this.prisma.session.findMany();

    if (session.length === 0) {
      throw new NotFoundException('Sessions not found!');
    }

    return session;
  }

  async remove(id: string) {
    return await this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!session) {
        throw new Error('Session topilmadi!');
      }

      await tx.session.delete({ where: { id } });

      await tx.user.update({
        where: { id: session.userId },
        data: { isVerified: false },
      });

      return { message: 'Session o‘chirildi!' };
    });
  }
}
