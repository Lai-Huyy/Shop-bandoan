import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthCookieService } from './auth-cookie.service';
import { REFRESH_TOKEN_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthenticationResult, SessionMetadata } from './auth.types';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './decorators/refresh-token.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new customer account' })
  @ApiCreatedResponse({
    description: 'User successfully registered and authenticated',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({
    description: 'Username or email is already registered',
  })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    return this.respondWithAuthentication(
      response,
      this.authService.register(
        dto,
        this.getSessionMetadata(ipAddress, userAgent),
      ),
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials' })
  @ApiOkResponse({
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Account is suspended or banned' })
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    return this.respondWithAuthentication(
      response,
      this.authService.login(
        dto,
        this.getSessionMetadata(ipAddress, userAgent),
      ),
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh token and issue a new access token',
  })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE_NAME)
  @ApiOkResponse({
    description: 'Refresh token accepted and rotated',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid or expired',
  })
  async refresh(
    @RefreshToken() refreshToken: string | undefined,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    return this.respondWithAuthentication(
      response,
      this.authService.refresh(
        refreshToken,
        this.getSessionMetadata(ipAddress, userAgent),
      ),
    );
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the current refresh-token session' })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE_NAME)
  @ApiOkResponse({ description: 'Current session successfully logged out' })
  async logout(
    @RefreshToken() refreshToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(refreshToken);
    this.authCookieService.clearRefreshToken(response);

    return { message: 'Successfully logged out' };
  }

  private async respondWithAuthentication(
    response: Response,
    authenticationResult: Promise<AuthenticationResult>,
  ): Promise<AuthResponseDto> {
    const authentication = await authenticationResult;
    this.authCookieService.setRefreshToken(response, authentication);

    return this.toAuthResponse(authentication);
  }

  private getSessionMetadata(
    ipAddress: string,
    userAgent: string | undefined,
  ): SessionMetadata {
    return { ipAddress, userAgent };
  }

  private toAuthResponse(result: AuthenticationResult): AuthResponseDto {
    return {
      user: result.user,
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresIn: result.accessTokenExpiresIn,
    };
  }
}
