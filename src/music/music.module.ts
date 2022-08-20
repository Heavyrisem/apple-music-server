import { DynamicModule, Module } from '@nestjs/common';

import { CONFIG_OPTIONS } from './music.constants';
import { MusicModuleOptions } from './music.interface';
import { MusicService } from './music.service';
import { MusicController } from './music.controller';

@Module({
  controllers: [MusicController],
})
export class MusicModule {
  static ForRoot(options: MusicModuleOptions): DynamicModule {
    return {
      module: MusicModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        MusicService,
      ],
      exports: [MusicService],
    };
  }
}
