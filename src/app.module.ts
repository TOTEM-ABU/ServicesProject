import { join } from 'path';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BrandModule } from './brand/brand.module';
import { ColorModule } from './color/color.module';
import { CommentModule } from './comment/comment.module';
import { ContactModule } from './contact/contact.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FaqModule } from './faq/faq.module';
import { GeneralInfoModule } from './general-info/general-info.module';
import { LevelModule } from './level/level.module';
import { MasterModule } from './master/master.module';
import { OrderModule } from './order/order.module';
import { PartnerModule } from './partner/partner.module';
import { ProductModule } from './product/product.module';
import { RegionModule } from './region/region.module';
import { SessionModule } from './session/session.module';
import { ShowcaseModule } from './showcase/showcase.module';
import { SizeModule } from './size/size.module';
import { ToolModule } from './tool/tool.module';
import { UserModule } from './user/user.module';
import { MulterController, PrismaModule } from './tools';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    BrandModule,
    ColorModule,
    CommentModule,
    ContactModule,
    DashboardModule,
    FaqModule,
    GeneralInfoModule,
    LevelModule,
    MasterModule,
    OrderModule,
    PartnerModule,
    ProductModule,
    RegionModule,
    SessionModule,
    ShowcaseModule,
    SizeModule,
    ToolModule,
    UserModule,
  ],
  controllers: [MulterController],
})
export class AppModule {}
