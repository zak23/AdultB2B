import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { Post } from '../posts/entities/post.entity';
import { PostsModule } from '../posts/posts.module';
import { NetworkingModule } from '../networking/networking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    PostsModule,
    NetworkingModule,
  ],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
