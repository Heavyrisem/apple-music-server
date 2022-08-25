import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CONFIG_OPTIONS } from './music.constants';
import { MusicModuleOptions } from './music.interface';
import { MusicService } from './music.service';
import { MusicController } from './music.controller';
import { MusicInfo } from './entity/musicInfo.entity';
import { MusicData } from './entity/musicData.entity';
import { MusicLyrics } from './entity/musicLyrics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MusicInfo, MusicData, MusicLyrics])],
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
