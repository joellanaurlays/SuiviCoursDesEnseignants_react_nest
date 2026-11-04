import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './current-user.decorator.js';
import type { AuthContext } from './auth-context.js';
import { AuthService } from './auth.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Connexion (email + mot de passe)' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Mot de passe oublié (génère un code de vérification)' })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Réinitialisation du mot de passe avec le code reçu' })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Profil de l'utilisateur connecté (via token)" })
  @Get('profile')
  getProfile(@CurrentUser() auth: AuthContext) {
    return this.usersService.getProfile(Number(auth.userId));
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Déconnexion' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Déconnexion effectuée.' };
  }
}
