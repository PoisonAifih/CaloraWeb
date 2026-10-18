import { BadRequestException, Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user';
import { AdminGuard } from '../common/guards/admin.guard';
import { MenusService } from '../menus/menus.service';
import { PlansService } from '../plans/plans.service';
import * as QRCode from 'qrcode';

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly plans: PlansService, private readonly menus: MenusService) {}

  @Get('dashboard')
  async dashboard(@CurrentUser() admin: User) {
    const data = await this.plans.adminDashboard();
    return { ...data, actor: { id: admin.id, name: admin.name } };
  }

  @Put('plans/:id/status')
  async setStatus(@CurrentUser() admin: User, @Param('id') id: string, @Body() body: { status?: string }) {
    const status = String(body.status || '');
    if (!['DRAFT', 'CONFIRMED', 'LOCKED', 'FULFILLED', 'CANCELLED'].includes(status)) {
      throw new BadRequestException('Invalid plan status');
    }
    await this.plans.setPlanStatus(decodeURIComponent(id), status);
    await this.plans.audit('PLAN_STATUS_CHANGED', {
      actorUserId: admin.id,
      entityType: 'adaptive_plan',
      entityId: id,
      detail: { status }
    });
    return { success: true };
  }

  @Get('menus')
  listMenus() {
    return this.menus.listAll();
  }

  @Post('menus')
  @HttpCode(HttpStatus.CREATED)
  async createMenu(@CurrentUser() admin: User, @Body() body: Record<string, unknown>) {
    const menu = await this.menus.create(body);
    await this.plans.audit('MENU_CREATED', { actorUserId: admin.id, entityType: 'menu', entityId: menu.id, detail: { name: menu.name } });
    return menu;
  }

  @Put('menus/:id')
  async updateMenu(@CurrentUser() admin: User, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const menu = await this.menus.update(decodeURIComponent(id), body);
    await this.plans.audit('MENU_UPDATED', { actorUserId: admin.id, entityType: 'menu', entityId: menu.id, detail: { name: menu.name, active: menu.active } });
    return menu;
  }

  // QR target is the app origin the admin is using, so it matches the public URL.
  @Get('menus/:id/qr.svg')
  @Header('Content-Type', 'image/svg+xml')
  @Header('Cache-Control', 'no-store')
  async menuQr(@Param('id') id: string, @Query('base') base?: string) {
    const menu = await this.menus.get(decodeURIComponent(id));
    let origin: string;
    try {
      const url = new URL(String(base || ''));
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      origin = url.origin;
    } catch {
      throw new BadRequestException('Invalid base URL');
    }
    return QRCode.toString(`${origin}/?menu=${encodeURIComponent(menu.id)}`, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1c1e1bff', light: '#ffffffff' } });
  }
}
