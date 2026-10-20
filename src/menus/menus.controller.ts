import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../common/guards/session.guard';
import { MenusService } from './menus.service';

// Read-only menu lookups for signed-in users: the catering catalog and menu QR scans.
@Controller('api/menus')
@UseGuards(SessionGuard)
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  @Get()
  async list() {
    const menus = await this.menus.listActive();
    return menus.map(({ inventoryAvailable, active, ...publicFields }) => publicFields);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const menu = await this.menus.get(decodeURIComponent(id));
    const { inventoryAvailable, active, ...publicFields } = menu;
    return publicFields;
  }
}
