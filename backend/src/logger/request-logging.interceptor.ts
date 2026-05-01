import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userId = req.user ? (req.user as any).userId || (req.user as any).id : undefined;
    const start = Date.now();

    const userStr = userId ? ` | userId=${userId}` : '';
    const requestMsg = `${method} ${url}${userStr}`;

    this.logger.debug(`[Request Start] ${requestMsg}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const res = context.switchToHttp().getResponse();
        const status = res.statusCode;
        this.logger.debug(`[Request End] ${requestMsg} | ${status} | ${duration}ms`);
      }),
      catchError((error) => {
        const duration = Date.now() - start;
        const status = error.status || 500;
        this.logger.error(
          `[Request Error] ${requestMsg} | ${status} | ${duration}ms | ${error.message}`,
          error.stack,
        );
        return throwError(() => error);
      }),
    );
  }
}
