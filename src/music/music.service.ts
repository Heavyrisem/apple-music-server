import fs from 'fs/promises';
import path from 'path';

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { YoutubeSearch } from '@heavyrisem/youtube-search';
import * as YoutubeMusicAPI from '@heavyrisem/ytmusic';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as youtubeDlExec from 'youtube-dl-exec';
import { MusicVideo } from '@heavyrisem/ytmusic';
import { SearchYoutubeModel } from '@heavyrisem/youtube-search/dist/models';

import { CONFIG_OPTIONS } from './music.constants';
import { MusicModuleOptions } from './music.interface';
import { MusicInfo } from './entity/musicInfo.entity';
import { MusicData } from './entity/musicData.entity';
import { MusicLyrics } from './entity/musicLyrics.entity';

@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);
  private youtubeAPI: YoutubeSearch;

  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MusicModuleOptions,
    @InjectRepository(MusicInfo) private readonly musicInfoRepository: Repository<MusicInfo>,
    @InjectRepository(MusicData) private readonly musicDataRepository: Repository<MusicData>,
    @InjectRepository(MusicLyrics) private readonly musicLyricsRepository: Repository<MusicLyrics>,
  ) {
    this.youtubeAPI = new YoutubeSearch(this.options.youtubeApiKey);
  }

  async searchVideos(
    q: string,
    lyrics = false,
  ): Promise<Pick<SearchYoutubeModel, 'id' | 'snippet'>[]> {
    return await this.youtubeAPI
      .searchYoutube(q, {
        maxResults: 5,
        videoCaption: lyrics ? 'closedCaption' : 'any',
      })
      .then((res) => res.map((result) => ({ id: result.id, snippet: result.snippet })));
  }

  async getMusic(id: string): Promise<MusicInfo> {
    const cachedMusicInfo = await this.musicInfoRepository.findOne({
      where: [{ videoId: id }, { musicId: id }],
    });
    if (cachedMusicInfo) {
      console.log(`[${cachedMusicInfo.videoId}] - Cached MusicInfo Data Found`);
      return cachedMusicInfo;
    }

    const youtubeResult = await this.getVideoInfo(id);

    // const relatedMusic = await this.getRelatedMusic(youtubeResult.id);
    // if (relatedMusic.ytMusicId) console.log('Related music id has found');

    const musicSearchResult = await this.getMusicMetadata(
      // relatedMusic.ytMusicId ?? youtubeResult.snippet.title,
      youtubeResult.snippet.title,
    );

    const saveResult = await this.saveMusicInfo(youtubeResult.id, musicSearchResult);

    return saveResult;
  }

  async searchMusic(query: string, caption = true): Promise<MusicInfo> {
    const youtubeSearchResult = await this.searchVideo(query, caption);

    const cachedMusicInfo = await this.musicInfoRepository.findOne({
      where: { videoId: youtubeSearchResult.id.videoId },
    });
    if (cachedMusicInfo) {
      this.logger.log(`[${cachedMusicInfo.videoId}] - Cached Search Data Found`);
      return cachedMusicInfo;
    }
    console.log(youtubeSearchResult.id.videoId);
    const relatedMusic = await this.getRelatedMusic(youtubeSearchResult.id.videoId);
    if (relatedMusic.ytMusicId) this.logger.log('Related music id has found');

    const musicSearchResult = await this.getMusicMetadata(
      relatedMusic.ytMusicId || youtubeSearchResult.id.videoId || youtubeSearchResult.snippet.title,
      // youtubeSearchResult.snippet.title,
    );

    const saveResult = await this.saveMusicInfo(youtubeSearchResult.id.videoId, musicSearchResult);

    return saveResult;
  }
  async getLyrics(
    videoId: string,
    languages = ['en', 'en-US', 'en-GB', 'ko'],
  ): Promise<MusicLyrics> {
    const cachedMusicLyrics = await this.musicLyricsRepository.findOne({
      where: { videoId },
    });
    if (cachedMusicLyrics) {
      console.log(`[${cachedMusicLyrics.videoId}] - Cached Music Lyrics Found`);
      return cachedMusicLyrics;
    }

    for (const lang of languages) {
      try {
        const lyrics = await this.youtubeAPI.getCaption(videoId, lang, 'vtt');
        if (lyrics.includes('<c>')) throw Error(`Could not find captions for ${lang}`);

        const saveResult = await this.musicLyricsRepository.save(
          this.musicLyricsRepository.create({
            lyrics,
            videoId,
            lang,
          }),
        );

        return saveResult;
      } catch (err) {
        console.log(err.message);
      }
    }

    throw Error(`Could not find captions`);
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

  private async getRelatedMusic(videoId: string) {
    try {
      return await this.youtubeAPI.getRelatedMusic(videoId);
    } catch (err) {
      return { ytMusicId: null };
    }
  }

  private getVideoInfo(videoId: string) {
    return this.youtubeAPI
      .getVideoInfo(videoId, { id: videoId, part: ['snippet'] })
      .then((res) => res.shift());
  }

  private async searchVideo(query: string, caption = false): Promise<SearchYoutubeModel> {
    const youtubeSearchResult = await this.youtubeAPI
      .searchYoutube(query, {
        videoCaption: caption ? 'closedCaption' : 'any',
        maxResults: 1,
        videoCategoryId: '10',
        regionCode: 'US',
      })
      .then((items) => items.shift())
      .catch((err) => console.log(err.response));
    if (!youtubeSearchResult) throw new NotFoundException('No result found on Youtube');

    return youtubeSearchResult;
  }

  private async getMusicMetadata(q: string): Promise<MusicVideo> {
    const musicSearchResult = await YoutubeMusicAPI.searchMusics(q, {
      headers: {
        Authorization: this.options.musicAuthorization,
        Cookie: this.options.musicCookie,
      },
    }).then((items) => items.shift());
    if (!musicSearchResult) throw new NotFoundException('No result found on Youtube Music');

    return musicSearchResult;
  }

  private async downloadMusic(videoId: string): Promise<Buffer> {
    const filePath = path.resolve(this.options.tempDir, `${videoId}.mp3`);
    const downloadProcess = await youtubeDlExec.exec(videoId, {
      extractAudio: true,
      audioQuality: 0,
      audioFormat: 'mp3',
      output: filePath,
    });
    if (downloadProcess.stderr && downloadProcess.stderr.includes('ERROR:')) {
      console.log(downloadProcess.stderr);
      throw new InternalServerErrorException('Cannot download music');
    }
    console.log(downloadProcess.stdout);
    const buf = await fs.readFile(filePath);
    await fs.rm(filePath);
    return buf;
  }

  private async saveMusicInfo(videoId: string, data: MusicVideo): Promise<MusicInfo> {
    const saveResult = await this.musicInfoRepository.save(
      this.musicInfoRepository.create({
        videoId,
        musicId: data.youtubeId,
        title: data.title,
        album: data.album,
        artists: data.artists.map((artist) => artist.name),
        thumbnail: data.thumbnailUrl,
        isExplicit: data.isExplicit,
      }),
    );

    return saveResult;
  }
}
