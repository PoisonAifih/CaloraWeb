import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../common/guards/session.guard';
import { MenusService } from './menus.service';

// Read-only lookup for users who scan a menu QR code.
@Controller('api/menus')
@UseGuards(SessionGuard)
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    const menu = await this.menus.get(decodeURIComponent(id));
    const { inventoryAvailable, active, ...publicFields } = menu;
    return publicFields;
  }
}
