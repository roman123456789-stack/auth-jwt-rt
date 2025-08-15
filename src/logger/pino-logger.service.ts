import { Injectable, LoggerService } from '@nestjs/common';
import * as pino from 'pino';
import { formatInTimeZone } from 'date-fns-tz';
// TODO
const moscowTime = () => formatInTimeZone(new Date(), 'Europe/Moscow', 'HH:mm:ss dd-MM-yyyy');

const fileTransport = pino.transport({
  target: 'pino/file',
  options: {
    destination: './logs/app.log',
    mkdir: true,
  },
});

// Простой логгер — только JSON в stdout
const logger = pino(
  {
    level: 'debug',
    formatters: {
        level(label, number) {
        return { level: number, levelLabel: label };
        },
    },
    timestamp: () => `"time":"${moscowTime()}"`,
  },
  fileTransport,
);

@Injectable()
export class PinoLogger implements LoggerService {
  private static instance: PinoLogger;
  private logger = logger;

  public static getInstance(): PinoLogger {
    if (!PinoLogger.instance) {
      PinoLogger.instance = new PinoLogger();
    }
    return PinoLogger.instance;
  }

  log(message: string | object, context?: string) {
    this.logger.info({ context }, this.stringify(message));
  }

  error(message: string | object, trace?: string, context?: string) {
    this.logger.error({ context, stack: trace }, this.stringify(message));
  }

  warn(message: string | object, context?: string) {
    this.logger.warn({ context }, this.stringify(message));
  }

  debug(message: string | object, context?: string) {
    this.logger.debug({ context }, this.stringify(message));
  }

  verbose(message: string | object, context?: string) {
    this.logger.trace({ context }, this.stringify(message));
  }

  private stringify(msg: string | object): string {
    return typeof msg === 'object' ? JSON.stringify(msg) : msg;
  }
}

// Глобальный логгер
// declare global {
//   var logger: PinoLogger;
// }

// global.logger = PinoLogger.getInstance();