import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { YoutubeSearch } from '@heavyrisem/youtube-search';
import * as YoutubeMusicAPI from '@heavyrisem/ytmusic';
import * as ytdl from 'ytdl-core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Writable } from 'typeorm/platform/PlatformTools';
import * as ffmpeg from 'fluent-ffmpeg';

import { CONFIG_OPTIONS } from './music.constants';
import { MusicModuleOptions } from './music.interface';
import { MusicInfo } from './entity/musicInfo.entity';
import { MusicData } from './entity/musicData.entity';

@Injectable()
export class MusicService {
  private youtubeAPI: YoutubeSearch;

  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MusicModuleOptions,
    @InjectRepository(MusicInfo) private readonly musicInfoRepository: Repository<MusicInfo>,
    @InjectRepository(MusicData) private readonly musicDataRepository: Repository<MusicData>,
  ) {
    this.youtubeAPI = new YoutubeSearch(this.options.youtubeApiKey);
  }

  async searchMusic(query: string, caption = true): Promise<MusicInfo> {
    const youtubeSearchResult = await this.youtubeAPI
      .searchYoutube(query, {
        videoCaption: caption ? 'closedCaption' : 'any',
        maxResults: 1,
      })
      .then((items) => items.shift());
    if (!youtubeSearchResult) throw new NotFoundException('No result found on Youtube');

    const cachedMusicInfo = await this.musicInfoRepository.findOne({
      where: { videoId: youtubeSearchResult.id.videoId },
    });
    if (cachedMusicInfo) return cachedMusicInfo;

    const relatedMusic = await this.youtubeAPI.getRelatedMusic(youtubeSearchResult.id.videoId);
    if (relatedMusic.ytMusicId) console.log('related music id has found');

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

    const saveResult = await this.musicInfoRepository.save(
      this.musicInfoRepository.create({
        videoId: youtubeSearchResult.id.videoId,
        musicId: musicSearchResult.youtubeId,
        title: musicSearchResult.title,
        album: musicSearchResult.album,
        artists: musicSearchResult.artists.map((artist) => artist.name),
        thumbnail: musicSearchResult.thumbnailUrl,
        isExplicit: musicSearchResult.isExplicit,
      }),
    );
    return saveResult;
  }

  async getLyrics(videoId: string, lang = 'en') {
    return await this.youtubeAPI.getCaption(videoId, lang, 'vtt');
  }

  async getVideoInfo(videoId: string) {
    return await this.youtubeAPI.getVideoInfo(videoId, { id: videoId });
  }

  async getMusicData(videoId: string): Promise<Buffer> {
    const musicData = await this.musicDataRepository.findOne({ where: { videoId } });
    if (musicData) {
      console.log('chaced Data Found');
      return musicData.data;
    }

    const musicBuffer = await this.downloadMusic(videoId);

    return await this.musicDataRepository
      .save(
        await this.musicDataRepository.create({
          data: musicBuffer,
          videoId,
        }),
      )
      .then((musicData) => musicData.data);
  }

  private async downloadMusic(videoId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      const downloadStream = await ytdl(videoId, {
        filter: 'audioonly',
      });
      const downloadBuffer = [];

      const writeStream = new Writable({
        write(this, chunk, encoding, callback) {
          downloadBuffer.push(chunk);
          console.log(chunk);
          callback();
        },
      });

      ffmpeg(downloadStream)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .format('mp3')
        .pipe(writeStream)
        .on('end', () => console.log('download end'))
        .on('finish', () => {
          console.log('download finish');
          resolve(Buffer.concat(downloadBuffer));
        })
        .on('error', (err) => {
          reject(new InternalServerErrorException(err));
        });
    });
  }
}
