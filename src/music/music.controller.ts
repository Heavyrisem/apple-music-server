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

import { getReadableStreamFromBuffer } from '~src/modules/utils';

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get('search')
  async search(@Query('q') query: string, @Query('lyrics') lyrics?: boolean) {
    console.log('query', query, 'lyrics', lyrics);
    return await this.musicService.searchMusic(query, lyrics);
  }

  @Get('caption/:videoId')
  async getCaption(@Param('videoId') videoId: string, @Query('lang') lang?: string) {
    try {
      return await this.musicService.getLyrics(videoId, lang);
    } catch (err) {
      const msg = err.message;
      if (typeof msg === 'string') {
        if (
          msg.includes('Could not find captions for') ||
          msg.includes('No captions found for this video') ||
          msg.includes('No video id found')
        )
          throw new NotFoundException(err.message);
      }

      throw new InternalServerErrorException(err.message);
    }
  }

  @Get('/:videoId')
  async getFile(@Res() res: Response, @Param('videoId') videoId: string) {
    const temp = await this.musicService.getMusicData(videoId);

    res.set({
      'Content-Length': temp.length,
      'Content-Type': 'application/mp3',
    });
    getReadableStreamFromBuffer(temp).pipe(res);
  }
}
