import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const user = await this.auth.userFromRequest(req);
    if (!user) throw new UnauthorizedException('Authentication required');
    this.auth.refreshCookie(req, http.getResponse());
    req.user = user;
    return true;
  }
}
