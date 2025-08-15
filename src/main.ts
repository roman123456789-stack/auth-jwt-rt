import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
// import { PinoLogger } from './logger/pino-logger.service';
import { WinstonLogger } from './logger/winston-logger.service';

import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: WinstonLogger.getInstance() });
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.enableCors({
    origin: '*', // или '*' для разработки
    credentials: true,
    exposedHeaders: ['X-New-Access-Token'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
