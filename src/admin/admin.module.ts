import { Module } from '@nestjs/common';
import { MenusModule } from '../menus/menus.module';
import { PlansModule } from '../plans/plans.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [PlansModule, MenusModule],
  controllers: [AdminController]
})
export class AdminModule {}
