import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { Reaction } from './entities/reaction.entity';
import { ReactionType } from './entities/reaction-type.entity';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reaction, ReactionType, Comment])],
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
