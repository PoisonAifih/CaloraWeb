import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const user = await this.auth.userFromRequest(req);
    if (!user) throw new UnauthorizedException('Authentication required');
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin role required');
    this.auth.refreshCookie(req, http.getResponse());
    req.user = user;
    return true;
  }
}
