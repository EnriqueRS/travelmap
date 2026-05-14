import { LoggerService, Injectable } from '@nestjs/common';
import { winstonLogger } from './logger.config';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private defaultContext = 'Application';

  log(message: string, context?: string): void {
    winstonLogger.info(message, { context: context || this.defaultContext });
  }

  error(message: string, trace?: string, context?: string): void {
    winstonLogger.error(message, { context: context || this.defaultContext, trace });
  }

  warn(message: string, context?: string): void {
    winstonLogger.warn(message, { context: context || this.defaultContext });
  }

  debug(message: string, context?: string): void {
    winstonLogger.debug(message, { context: context || this.defaultContext });
  }

  verbose(message: string, context?: string): void {
    winstonLogger.verbose(message, { context: context || this.defaultContext });
  }

  setDefaultContext(context: string): void {
    this.defaultContext = context;
  }
}
