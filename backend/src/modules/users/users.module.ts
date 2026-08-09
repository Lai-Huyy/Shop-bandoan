import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AdminUsersController } from './admin-users.controller';

@Module({
  controllers: [UsersController, AdminUsersController],
  providers: [UsersRepository, UsersService],
})
export class UsersModule {}
