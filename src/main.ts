import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { PinoLogger } from './logger/pino-logger.service';
import { WinstonLogger } from './logger/winston-logger.service';

import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: PinoLogger.getInstance() });
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: '*',
    credentials: true,
    exposedHeaders: ['X-New-Access-Token, X-Correlation-Id'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
