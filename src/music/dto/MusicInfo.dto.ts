import { MusicInfo } from '../music.interface';

export class MusicInfoDto implements MusicInfo {
  videoId: string;
  musicId: string;
  title: string;
  album: string;
  artists: string[];
  thumbnail: string;
  isExplicit: boolean;

  public static from({
    videoId,
    musicId,
    title,
    album,
    artists,
    thumbnail,
    isExplicit,
  }: MusicInfo): MusicInfoDto {
    const musicInfoDto = new MusicInfoDto();
    musicInfoDto.videoId = videoId;
    musicInfoDto.musicId = musicId;
    musicInfoDto.title = title;
    musicInfoDto.album = album;
    musicInfoDto.artists = artists;
    musicInfoDto.thumbnail = thumbnail;
    musicInfoDto.isExplicit = isExplicit;

    return musicInfoDto;
  }
}
