
import {
  Controller, Post, Get, Body, UseGuards, Request, Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }


  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    return this.authService.me(req.user.id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    const userId = req.user?.id || '1';
    return this.authService.changePassword(userId, dto);
  }
}

