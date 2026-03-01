import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
      ignoreExpiration: false, // токен истёк — не пропускаем
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // payload.sub приходит из jwtService.sign({ sub: user.id, email: user.email })
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Passport автоматически подставит этот объект в req.user
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}