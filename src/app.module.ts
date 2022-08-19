import { Module } from '@nestjs/common';

import { ConfigurationModule } from './modules/config/config.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [ConfigurationModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
