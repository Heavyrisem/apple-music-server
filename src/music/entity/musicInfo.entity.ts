import { Column, Entity } from 'typeorm';

import { MusicInfo as MusicInfoType } from '../music.interface';

import { CoreEntity } from '~src/modules/database/core.entity';

@Entity()
export class MusicInfo extends CoreEntity implements MusicInfoType {
  @Column({ unique: true })
  videoId: string;

  @Column()
  musicId: string;

  @Column()
  title: string;

  @Column()
  album: string;

  @Column('simple-array')
  artists: string[];

  @Column()
  thumbnail: string;

  @Column()
  isExplicit: boolean;
}
