import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../../auth/auth-user.interface';

export const AUTH_COOKIE = 'absenkan_token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Tidak terautentikasi');

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      // Pastikan akun masih aktif saat request (cek DB dilakukan di service bila perlu).
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Sesi tidak valid atau telah berakhir');
    }
  }

  private extractToken(request: Request): string | undefined {
    // Prioritas: cookie HttpOnly. Fallback: Authorization Bearer (untuk tooling/curl).
    const fromCookie = (request.cookies as Record<string, string>)?.[AUTH_COOKIE];
    if (fromCookie) return fromCookie;
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return undefined;
  }
}
