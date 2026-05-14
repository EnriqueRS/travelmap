import { Global, Module } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { ExceptionLoggingFilter } from './exception-logging.filter';

@Global()
@Module({
  providers: [WinstonLoggerService, RequestLoggingInterceptor, ExceptionLoggingFilter],
  exports: [WinstonLoggerService, RequestLoggingInterceptor, ExceptionLoggingFilter],
})
export class LoggerModule {}
