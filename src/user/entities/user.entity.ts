import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { RolesEnum } from '../enums/roles.enum';
import { RefreshToken } from 'src/auth/entities/refresh.entity';

@Entity()
@Unique(['email', 'role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, name: 'first_name', nullable: true })
  firstName: string;

  @Column({ length: 255, name: 'last_name', nullable: true })
  lastName: string;

  @Column({ length: 255, name: 'email' })
  email: string;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: RolesEnum, default: RolesEnum.user })
  role: RolesEnum;

  @OneToMany(() => RefreshToken, (refresh) => refresh.user)
  refreshTokens: RefreshToken[];

  @Column({ type: 'bool', default: false })
  is_verified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
