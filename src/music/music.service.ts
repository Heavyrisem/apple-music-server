import fs from 'fs/promises';
import path from 'path';

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { YoutubeSearch } from '@heavyrisem/youtube-search';
import * as YoutubeMusicAPI from '@heavyrisem/ytmusic';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as youtubeDlExec from 'youtube-dl-exec';

import { CONFIG_OPTIONS } from './music.constants';
import { MusicModuleOptions } from './music.interface';
import { MusicInfo } from './entity/musicInfo.entity';
import { MusicData } from './entity/musicData.entity';
import { MusicLyrics } from './entity/musicLyrics.entity';

@Injectable()
export class MusicService {
  private youtubeAPI: YoutubeSearch;

  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MusicModuleOptions,
    @InjectRepository(MusicInfo) private readonly musicInfoRepository: Repository<MusicInfo>,
    @InjectRepository(MusicData) private readonly musicDataRepository: Repository<MusicData>,
    @InjectRepository(MusicLyrics) private readonly musicLyricsRepository: Repository<MusicLyrics>,
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
    if (cachedMusicInfo) {
      console.log(`[${cachedMusicInfo.videoId}] - Cached Search Data Found`);
      return cachedMusicInfo;
    }

    const relatedMusic = await this.youtubeAPI.getRelatedMusic(youtubeSearchResult.id.videoId);
    if (relatedMusic.ytMusicId) console.log('Related music id has found');

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

  async getLyrics(videoId: string, lang = 'en'): Promise<MusicLyrics> {
    const cachedMusicLyrics = await this.musicLyricsRepository.findOne({ where: { videoId } });
    if (cachedMusicLyrics) {
      console.log(`[${cachedMusicLyrics.videoId}] - Cached Music Lyrics Found`);
      return cachedMusicLyrics;
    }

    const lyrics = await this.youtubeAPI.getCaption(videoId, lang, 'vtt');
    const saveResult = await this.musicLyricsRepository.save(
      this.musicLyricsRepository.create({
        lyrics,
        videoId,
      }),
    );

    return saveResult;
  }

  async getVideoInfo(videoId: string) {
    return await this.youtubeAPI.getVideoInfo(videoId, { id: videoId });
  }

  async getMusicData(videoId: string): Promise<MusicData> {
    const cachedMusicData = await this.musicDataRepository.findOne({ where: { videoId } });
    if (cachedMusicData) {
      console.log(`[${videoId}] - Cached Music Data Found`);
      return cachedMusicData;
    }

    const musicBuffer = await this.downloadMusic(videoId);
    const saveResult = await this.musicDataRepository.save(
      this.musicDataRepository.create({
        data: musicBuffer,
        videoId,
      }),
    );

    return saveResult;
  }

  private async downloadMusic(videoId: string): Promise<Buffer> {
    const filePath = path.resolve(this.options.tempDir, `${videoId}.mp3`);
    const downloadProcess = await youtubeDlExec.exec(videoId, {
      extractAudio: true,
      audioQuality: 0,
      audioFormat: 'mp3',
      output: filePath,
    });
    if (downloadProcess.stderr) {
      console.error(downloadProcess.stderr);
      throw new InternalServerErrorException('Cannot download music');
    }

    const buf = await fs.readFile(filePath);
    await fs.rm(filePath);
    return buf;
  }
}
