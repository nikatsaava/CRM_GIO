import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const disabled = process.env.AUTH_DISABLED === 'true';
    const isProd = process.env.NODE_ENV === 'production';

    // В ПРОДЕ НИКОГДА не отключаем авторизацию
    if (isProd && disabled) return super.canActivate(context);

    // Локально можно отключать
    if (!isProd && disabled) return true;

    return super.canActivate(context);
  }
}

// import { Injectable } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {}
