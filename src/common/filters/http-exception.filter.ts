import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { formatInTimeZone } from 'date-fns-tz';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    logger.error(exception as any, '', 'HttpExceptionFilter');

    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : { message: 'Internal server error' };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Internal server error';

    const error = typeof exceptionResponse === 'string' ? 'Error' : (exceptionResponse as any).error || 'Error';

    const requestId = request['requestId'] || null;
    const moscowTime = () => formatInTimeZone(new Date(), 'Europe/Moscow', 'HH:mm:ss dd-MM-yyyy');

    const errorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: moscowTime(),
      requestId,
    };

    response.status(status).json(errorResponse);
  }
}
