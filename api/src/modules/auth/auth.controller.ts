import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { AuthService } from './auth.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

/** Stricter rate limit for routes attackers like to hammer. */
const AUTH_RATE_LIMIT = { default: { limit: 10, ttl: 60_000 } };
/**
 * Refresh tokens are long random single-use secrets, so guessing is not a risk; every page load
 * spends one, so this limit is higher than login's.
 */
const REFRESH_RATE_LIMIT = { default: { limit: 40, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Create an account (customer, brand or tailor) and start a session. */
  @Public()
  @Throttle(AUTH_RATE_LIMIT)
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  /** Log in with email and password. 5 wrong passwords lock the account for 15 minutes. */
  @Public()
  @Throttle(AUTH_RATE_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  /** Exchange a refresh token for a new access + refresh token pair (the old one stops working). */
  @Public()
  @Throttle(REFRESH_RATE_LIMIT)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  /** End this session. Public because the access token may already have expired. */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }

  /** The logged-in user's account. */
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: User): User {
    return user;
  }
}
