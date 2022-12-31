import { Injectable, NestMiddleware } from '@nestjs/common';
import { Logger } from '@nestjs/common/services';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const loggerService = new Logger('InComingRequest');
    const tempUrl = req.method + ' ' + req.baseUrl.split('?')[0];
    // const _headers = JSON.stringify(req.headers ? req.headers : {});
    const _query = JSON.stringify(req.query ? req.query : {});
    const _body = JSON.stringify(req.body ? req.body : {});
    const _url = JSON.stringify(tempUrl ? tempUrl : {});

    loggerService.log(`${_url} ${_query} ${_body}`.replace(/\\/, ''));
    next();
  }
}
