import { Controller, Post, Get, Body, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "@/common/decorators";
import { CurrentUser, CurrentUserType } from "@/common/decorators";
import { Request } from "express";

@ApiTags("认证管理")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @ApiOperation({ summary: "用户登录" })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    // 获取客户端 IP
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
      || req.headers['x-real-ip']?.toString()
      || req.ip
      || '';
    // 获取 User-Agent
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户信息" })
  async getProfile(@CurrentUser() user: CurrentUserType) {
    return this.authService.getProfile(user.id);
  }

  @Get("routers")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取路由菜单" })
  async getRouters(@CurrentUser() user: CurrentUserType) {
    return this.authService.getRouters(user.id);
  }

  @Post("logout")
  @ApiBearerAuth()
  @ApiOperation({ summary: "退出登录" })
  async logout() {
    // JWT 无状态，客户端删除 token 即可
    return { message: "退出成功" };
  }
}
