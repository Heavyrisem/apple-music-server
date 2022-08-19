import { Column, PrimaryColumn } from 'typeorm';

export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;
}
