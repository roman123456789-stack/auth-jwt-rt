import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { TokenService } from 'src/auth/token.service';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/user.dto';
import { DeviceInfo } from 'src/auth/types/device-info.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tokenService: TokenService,
  ) {}

  public async validateUser(email: string, password: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && (await this.comparePassword(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  private async comparePassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  public async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  public async create(createUserDto: CreateUserDto, deviceInfo: DeviceInfo) {
    const { password, email } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const refresh_token = await this.tokenService.generateNewRefreshToken(user.id, deviceInfo);
    const access_token = await this.tokenService.generateNewAccessToken(user.id, user.email, user.role, 1);

    const tokens = { access_token, refresh_token: refresh_token.token };

    const userDto = plainToInstance(UserDto, savedUser);

    return {
      user: userDto,
      tokens,
    };
  }
}
