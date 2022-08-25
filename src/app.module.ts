import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { ConfigurationModule } from './modules/config/config.module';
import { LoggerMiddleware } from './modules/logging/logger.middleware';
import { UserModule } from './user/user.module';
import { MusicModule } from './music/music.module';
import { DatabaseModule } from './modules/database/database.module';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    UserModule,
    MusicModule.ForRoot({
      youtubeApiKey: process.env.YOUTUBE_API_KEY,
      musicAuthorization: process.env.YOUTUBE_MUSIC_AUTHORIZATION,
      musicCookie: process.env.YOUTUBE_MUSIC_COOKIE,
      tempDir: process.env.YOUTUBE_TEMP_DIR,
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
