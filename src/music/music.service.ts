import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { YoutubeSearch } from '@heavyrisem/youtube-search';
import * as YoutubeMusicAPI from '@heavyrisem/ytmusic';

import { CONFIG_OPTIONS } from './music.constants';
import { MusicModuleOptions } from './music.interface';
import { MusicInfoDto } from './dto/MusicInfo.dto';

@Injectable()
export class MusicService {
  private youtubeAPI: YoutubeSearch;

  constructor(@Inject(CONFIG_OPTIONS) private readonly options: MusicModuleOptions) {
    this.youtubeAPI = new YoutubeSearch(this.options.youtubeApiKey);
  }

  async searchMusic(query: string) {
    const youtubeSearchResult = await this.youtubeAPI
      .searchYoutube(query, {
        videoCaption: 'closedCaption',
        maxResults: 1,
      })
      .then((items) => items.shift());
    if (!youtubeSearchResult) throw new NotFoundException('No result found on Youtube');

    const relatedMusic = await this.youtubeAPI.getRelatedMusic(youtubeSearchResult.id.videoId);
    // if (relatedMusic.ytMusicId) console.log('relatedMusic id has found');

    const musicSearchResult = await YoutubeMusicAPI.searchMusics(
      relatedMusic.ytMusicId ?? youtubeSearchResult.snippet.title,
      {
        headers: {
          Authorization: this.options.musicAuthorization,
          Cookie: this.options.musicCookie,
        },
      },
    ).then((items) => items.shift());
    if (!musicSearchResult) throw new NotFoundException('No result found on Youtube Music');

    return MusicInfoDto.from({
      videoId: youtubeSearchResult.id.videoId,
      musicId: musicSearchResult.youtubeId,
      title: musicSearchResult.title,
      album: musicSearchResult.album,
      artists: musicSearchResult.artists.map((artist) => artist.name),
      thumbnail: musicSearchResult.thumbnailUrl,
      isExplicit: musicSearchResult.isExplicit,
    });
  }

  async getCaption(videoId: string) {
    return await this.youtubeAPI.getCaption(videoId, 'vtt');
  }

  async getVideoInfo(videoId: string) {
    return await this.youtubeAPI.getVideoInfo(videoId, { id: videoId });
  }
}
