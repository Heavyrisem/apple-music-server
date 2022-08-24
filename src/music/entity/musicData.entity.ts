import { Column, Entity } from 'typeorm';

import { MusicData as MusicDataType } from '../music.interface';

import { CoreEntity } from '~src/modules/database/core.entity';

@Entity()
export class MusicData extends CoreEntity implements MusicDataType {
  @Column()
  videoId: string;

  @Column('mediumblob')
  data: Buffer;
}
