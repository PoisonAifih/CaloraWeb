import { Injectable, UnauthorizedException } from '@nestjs/common';
import { NutritionProfile, User } from '@prisma/client';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { publicUser } from '../common/mappers';
import { randomToken, verifyPassword } from '../common/crypto';

const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_MAX_AGE = SESSION_TTL_MS / 1000;
// Guest accounts are throwaway: each visit gets its own, removed with all its data after a day.
const GUEST_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async userFromRequest(req: Request) {
    const token = req.cookies?.calora_session;
    if (!token) return null;
    const session = await this.prisma.session.findUnique({ where: { id: token }, include: { user: true } });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) await this.prisma.session.delete({ where: { id: token } }).catch(() => undefined);
      return null;
    }
    await this.prisma.session.update({
      where: { id: token },
      data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) }
    });
    return session.user;
  }

  async login(username: string, password: string, res: Response) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: username, mode: 'insensitive' } },
          { email: { equals: username, mode: 'insensitive' } }
        ]
      },
      include: { profile: true }
    });
    if (!user || !verifyPassword(password || '', user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.startSession(user, res);
  }

  async guest(res: Response) {
    await this.prisma.user.deleteMany({ where: { role: 'GUEST', createdAt: { lt: new Date(Date.now() - GUEST_TTL_MS) } } });
    const suffix = randomToken(6);
    // '!' is not a valid password hash, so nobody can sign in to a guest account with a password.
    const user = await this.prisma.user.create({
      data: {
        id: `guest_${suffix}`,
        name: `Guest CAI ${suffix}`,
        passwordHash: '!',
        role: 'GUEST',
        profile: { create: { age: 25, sex: 'male', heightCm: 171, weightKg: 65, activityLevel: 'moderate', goalType: 'maintain', targetWeightKg: 65 } }
      },
      include: { profile: true }
    });
    return this.startSession(user, res);
  }

  private async startSession(user: User & { profile: NutritionProfile | null }, res: Response) {
    const token = randomToken();
    await this.prisma.session.create({
      data: { id: token, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) }
    });
    this.writeCookie(res, token, SESSION_MAX_AGE);
    return { user: publicUser(user, user.profile), sessionToken: token };
  }

  async current(req: Request, res: Response) {
    const user = await this.userFromRequest(req);
    if (!user) throw new UnauthorizedException('Authentication required');
    this.refreshCookie(req, res);
    const profile = await this.prisma.nutritionProfile.findUnique({ where: { userId: user.id } });
    return { user: publicUser(user, profile) };
  }

  refreshCookie(req: Request, res: Response) {
    const token = req.cookies?.calora_session;
    if (token) this.writeCookie(res, token, SESSION_MAX_AGE);
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies?.calora_session;
    if (token) await this.prisma.session.delete({ where: { id: token } }).catch(() => undefined);
    this.writeCookie(res, '', 0);
    return { success: true };
  }

  private writeCookie(res: Response, token: string, maxAge: number) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `calora_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`);
  }
}
