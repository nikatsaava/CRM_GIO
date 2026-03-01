import {
  Injectable, UnauthorizedException, NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';



@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('მომხმარებელი ვერ მოიძებნა');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('პაროლი არასწორია');

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    return {
      access_token: token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async me(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    return { id: user.id, email: user.email, role: user.role };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('მიმდინარე პაროლი არასწორია');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);
    return { message: 'პაროლი წარმატებით შეიცვალა' };
  }

  // Called from seed
  async createAdminIfNotExists(email: string, password: string) {
    const exists = await this.userRepo.findOne({ where: { email } });
    if (exists) return exists;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({ email, passwordHash, role: 'admin' });
    return this.userRepo.save(user);
  }
}
