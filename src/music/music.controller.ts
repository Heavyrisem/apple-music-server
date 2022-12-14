import { Response } from 'express';
import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';

import { MusicService } from './music.service';
import { MusicInfo } from './entity/musicInfo.entity';
import { MusicLyrics } from './music.interface';

import { getReadableStreamFromBuffer } from '~src/modules/utils';

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get('/video/search')
  async searchVideos(@Query('q') query: string, @Query('lyrics') lyrics?: boolean) {
    return await this.musicService.searchVideos(query, lyrics);
  }

  @Get('/search')
  async search(@Query('q') query: string, @Query('lyrics') lyrics?: boolean): Promise<MusicInfo> {
    console.log('query', query, 'lyrics', lyrics);
    return await this.musicService.searchMusic(query, lyrics);
  }

  @Get('/lyrics/:videoId')
  async getCaption(
    @Param('videoId') videoId: string,
    @Query('lang') lang?: string[],
  ): Promise<MusicLyrics> {
    try {
      return await this.musicService.getLyrics(videoId, lang);
    } catch (err) {
      const msg = err.message;
      if (typeof msg === 'string') {
        if (
          msg.includes('Could not find captions') ||
          msg.includes('No captions found for this video') ||
          msg.includes('No video id found')
        )
          throw new NotFoundException(err.message);
      }

      throw new InternalServerErrorException(err.message);
    }
  }

  @Get('/file/:videoId')
  async getFile(@Res() res: Response, @Param('videoId') videoId: string) {
    const musicData = await this.musicService.getMusicData(videoId);

    res.set({
      'Content-Length': musicData.data.length,
      'Content-Type': 'audio/mp3',
      'Accept-Ranges': 'bytes',
    });
    getReadableStreamFromBuffer(musicData.data).pipe(res);
  }

  @Get('/:videoId')
  async getInfo(@Param('videoId') videoId: string): Promise<MusicInfo> {
    return await this.musicService.getMusic(videoId);
  }
}
