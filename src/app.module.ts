import { Module } from '@nestjs/common';

import { ConfigurationModule } from './modules/config/config.module';
import { UserModule } from './user/user.module';
import { YoutubeModule } from './youtube/youtube.module';

@Module({
  imports: [ConfigurationModule, UserModule, YoutubeModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
