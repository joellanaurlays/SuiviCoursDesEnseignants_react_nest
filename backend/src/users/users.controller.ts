import {
  Body, Controller, DefaultValuePipe, Get, Param,
  ParseIntPipe, Patch, Post, Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/roles.enum.js';
import type { AuthContext } from '../auth/auth-context.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

const MANAGE_USERS_ROLES = [Role.SCOLARITE, Role.ADMINISTRATEUR];

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(...MANAGE_USERS_ROLES)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(...MANAGE_USERS_ROLES)
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.usersService.findAll({ search, role, isActive, page: page!, limit: limit! });
  }

  @Get('me')
  getMe(@CurrentUser() auth: AuthContext) {
    return this.usersService.getProfile(Number(auth.userId));
  }

  @Patch('me')
  updateMe(@CurrentUser() auth: AuthContext, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(Number(auth.userId), dto);
  }

  @Patch('me/password')
  changeMyPassword(@CurrentUser() auth: AuthContext, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(Number(auth.userId), dto);
  }

  @Get(':id')
  @Roles(...MANAGE_USERS_ROLES)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(...MANAGE_USERS_ROLES)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
