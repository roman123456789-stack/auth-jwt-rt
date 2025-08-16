import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({name: "token"})
  token: string;

  @Column({ nullable: false, name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: "expires_at" })
  expires_at: Date;

  @Column({ default: false, name: 'revoked' })
  revoked: boolean;

  @Column('json', { nullable: true })
  device_info?: Record<string, any>;

  @Column({type: 'int', name: 'access_token_version', default: 1})
  access_token_version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at;
}
