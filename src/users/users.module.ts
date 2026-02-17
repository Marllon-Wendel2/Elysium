import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { HashingService } from 'src/infra/hashing/hashing.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, HashingService],
  exports: [UsersService, HashingService],
})
export class UsersModule {}
