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
  async search(@Query('q') query: string) {
    console.log('query', query);
    return await this.musicService.searchMusic(query);
  }

  @Get('caption/:videoId')
  async getCaption(@Param('videoId') videoId: string, @Query('lang') lang?: string) {
    try {
      return await this.musicService.getCaption(videoId, lang);
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

  // TODO: send stream data with file name
  @Get()
  async getFile(@Res() res: Response) {
    console.log('/music');
    const temp = await this.musicService.getMusicData('RMPX_vgqQnM');

    res.set({
      'Content-Length': temp.length,
      'Content-Type': 'application/mp3',
    });
    getReadableStreamFromBuffer(temp).pipe(res);
    // const file = createReadStream(join(process.cwd(), 'test.mp3'));
    // file.pipe(res);
  }

  // @Get('/:videoId')
  // async downloadMusic(@Param('videoId') videoId: string) {
  //   return await this.musicService.downloadMusic(videoId);
  // }
}
