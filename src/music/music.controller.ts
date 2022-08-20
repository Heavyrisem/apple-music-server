import { Controller, Get, Param, Query } from '@nestjs/common';

import { MusicService } from './music.service';

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    console.log('query', query);
    return await this.musicService.searchMusic(query);
  }

  @Get('caption/:videoId')
  async getCaption(@Param('videoId') videoId: string) {
    return await this.musicService.getCaption(videoId);
  }
}
