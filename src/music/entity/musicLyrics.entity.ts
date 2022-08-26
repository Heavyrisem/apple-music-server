import { Column, Entity } from 'typeorm';

import { MusicLyrics as MusicLyricsType } from '../music.interface';

import { CoreEntity } from '~src/modules/database/core.entity';

@Entity()
export class MusicLyrics extends CoreEntity implements MusicLyricsType {
  @Column()
  videoId: string;

  @Column()
  lang: string;

  @Column('text')
  lyrics: string;
}
