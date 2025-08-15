import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { configValidationSchema } from './config/config.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from './redis/redis.service';


@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      validationSchema: configValidationSchema,
      isGlobal: true,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // Авто-поиск сущностей
        synchronize: config.get<boolean>('DB_SYNC'), // false в prod!
        logging: config.get<boolean>('DB_LOGGING'),
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        cli: {
          migrationsDir: 'src/migrations',
        },
      }),
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService],
})
export class AppModule {}
