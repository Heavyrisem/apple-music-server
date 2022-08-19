import { DynamicModule, Module } from '@nestjs/common';

import { CONFIG_OPTIONS } from './youtube.constants';
import { YoutubeModuleOptions } from './youtube.interface';
import { YoutubeService } from './youtube.service';

@Module({})
export class YoutubeModule {
  static ForRoot(options: YoutubeModuleOptions): DynamicModule {
    return {
      module: YoutubeModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        YoutubeService,
      ],
      exports: [YoutubeService],
    };
  }
}
