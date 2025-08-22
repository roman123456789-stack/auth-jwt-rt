import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { formatInTimeZone } from 'date-fns-tz';

// Настраиваем цвета для разных уровней логов
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'cyan',
});

const { combine, timestamp, errors, printf, colorize } = winston.format;

const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    timestamp({
      format: () => formatInTimeZone(new Date(), 'Europe/Moscow', 'HH:mm:ss dd-MM-yyyy'),
    }),
    errors({ stack: true }),
    colorize({ level: true }), // Цвет только для уровня лога
    printf(({ level, message, timestamp, context, stack }) => {
      const contextMsg = context ? `[${context}] ` : '';
      const stackMsg = stack ? `\n${stack}` : '';
      return `[${timestamp}] ${contextMsg}[${level}]: ${JSON.stringify(message)}${stackMsg}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

@Injectable()
export class WinstonLogger implements LoggerService {
  private static instance: WinstonLogger;
  private logger: winston.Logger;

  public static getInstance(): WinstonLogger {
    if (!WinstonLogger.instance) {
      WinstonLogger.instance = new WinstonLogger();
    }
    return WinstonLogger.instance;
  }

  log(message: string, context?: string) {
    logger.info(message, { context });
  }

  error(message: string, trace: string, context?: string) {
    logger.error(message, { context, stack: trace });
  }

  warn(message: string, context?: string) {
    logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    logger.verbose(message, { context });
  }
}

// declare global {
//   var logger: WinstonLogger;
// }

// global.logger = WinstonLogger.getInstance();
