import { Column, Entity } from 'typeorm';

import { MusicLyrics as MusicLrycisType } from '../music.interface';

import { CoreEntity } from '~src/modules/database/core.entity';

@Entity()
export class MusicLrycis extends CoreEntity implements MusicLrycisType {
  @Column()
  videoId: string;

  @Column()
  lyrics: string;
}
