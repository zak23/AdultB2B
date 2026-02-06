import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkingController } from './networking.controller';
import { NetworkingService } from './networking.service';
import { Connection } from './entities/connection.entity';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Connection, Follow, User])],
  controllers: [NetworkingController],
  providers: [NetworkingService],
  exports: [NetworkingService],
})
export class NetworkingModule {}
