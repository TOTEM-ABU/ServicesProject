import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Request } from 'express';
import { RoleType } from '../generated/prisma/enums';
import { Roles, RoleGuard, AuthGuard } from '../tools';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-brands')
  getBrands(@Req() req: Request) {
    return this.dashboardService.myBrands(req['user']);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-sizes')
  getSizes(@Req() req: Request) {
    return this.dashboardService.mySizes(req['user']);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-colors')
  getCapacities(@Req() req: Request) {
    return this.dashboardService.myColors(req['user']);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-tools')
  getTools(@Req() req: Request) {
    return this.dashboardService.myTools(req['user']);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-products')
  getProducts(@Req() req: Request) {
    return this.dashboardService.myProducts(req['user']);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-masters')
  getMasters(@Req() req: Request) {
    return this.dashboardService.myMasters(req['user']);
  }

  @Roles(
    RoleType.ADMIN,
    RoleType.SUPER_ADMIN,
    RoleType.USER,
    RoleType.VIEWER_ADMIN,
  )
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-comments')
  getComments(@Req() req: Request) {
    return this.dashboardService.myComments(req['user']);
  }

  @Roles(
    RoleType.ADMIN,
    RoleType.SUPER_ADMIN,
    RoleType.USER,
    RoleType.VIEWER_ADMIN,
  )
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-orders')
  getOrders(@Req() req: Request) {
    return this.dashboardService.myOrders(req['user']);
  }

  @Roles(
    RoleType.ADMIN,
    RoleType.SUPER_ADMIN,
    RoleType.USER,
    RoleType.VIEWER_ADMIN,
  )
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('my-stars')
  getStars(@Req() req: Request) {
    return this.dashboardService.myStars(req['user']);
  }

  @Roles(
    RoleType.ADMIN,
    RoleType.SUPER_ADMIN,
    RoleType.USER,
    RoleType.VIEWER_ADMIN,
  )
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return this.dashboardService.myProfile(req['user']);
  }
}
