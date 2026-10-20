import { randomBytes } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Menu, Prisma } from '@prisma/client';
import { httpError, numeric } from '../common/http';
import { PrismaService } from '../prisma/prisma.service';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const DIETARY_TAGS = ['none', 'vegetarian', 'vegan', 'pescatarian'];

function list(value: unknown) {
  const items = Array.isArray(value) ? value : String(value ?? '').split(',');
  return [...new Set(items.map(item => String(item).trim().toLowerCase()).filter(Boolean))].slice(0, 20).map(item => item.slice(0, 40));
}

export function validateMenu(input: Record<string, unknown> = {}, current?: Menu) {
  const pick = (key: string) => input[key] ?? (current as any)?.[key];
  const name = String(pick('name') ?? '').trim();
  if (!name || name.length > 120) throw httpError('Menu name is required', HttpStatus.BAD_REQUEST);
  const mealType = String(pick('mealType') ?? '').toUpperCase();
  if (!MEAL_TYPES.includes(mealType)) throw httpError('Invalid mealType', HttpStatus.BAD_REQUEST);
  const dietaryTags = list(pick('dietaryTags')).filter(tag => DIETARY_TAGS.includes(tag));
  return {
    name,
    mealType,
    calories: numeric(pick('calories'), 'calories', 1, 5000),
    proteinG: numeric(pick('proteinG') ?? 0, 'proteinG', 0, 1000),
    carbsG: numeric(pick('carbsG') ?? 0, 'carbsG', 0, 1000),
    fatG: numeric(pick('fatG') ?? 0, 'fatG', 0, 1000),
    allergens: list(pick('allergens')) as Prisma.InputJsonValue,
    dietaryTags: (dietaryTags.length ? dietaryTags : ['none']) as Prisma.InputJsonValue,
    inventoryAvailable: Math.round(numeric(pick('inventoryAvailable') ?? 0, 'inventoryAvailable', 0, 100000)),
    servingSize: String(pick('servingSize') ?? '1 serving').trim().slice(0, 80) || '1 serving',
    active: input.active === undefined ? current?.active ?? true : Boolean(input.active)
  };
}

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.menu.findMany({ orderBy: [{ active: 'desc' }, { mealType: 'asc' }, { name: 'asc' }] });
  }

  listActive() {
    return this.prisma.menu.findMany({ where: { active: true }, orderBy: [{ mealType: 'asc' }, { name: 'asc' }] });
  }

  async get(id: string) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) throw httpError('Menu not found', HttpStatus.NOT_FOUND);
    return menu;
  }

  create(input: Record<string, unknown>) {
    return this.prisma.menu.create({ data: { id: `M${randomBytes(3).toString('hex').toUpperCase()}`, ...validateMenu(input) } });
  }

  async update(id: string, input: Record<string, unknown>) {
    const current = await this.get(id);
    return this.prisma.menu.update({ where: { id }, data: validateMenu(input, current) });
  }
}
