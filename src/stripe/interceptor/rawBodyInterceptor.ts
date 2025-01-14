import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RawBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request:any = context.switchToHttp().getRequest<Request>();
    request.rawBody = Buffer.from(request.body);

    return next.handle();
  }
}
