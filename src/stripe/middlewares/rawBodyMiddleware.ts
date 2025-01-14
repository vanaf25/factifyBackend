import * as bodyParser from 'body-parser';

export function rawBodyMiddleware(req: any, res: any, next: any): void {
  bodyParser.raw({ type: 'application/json' })(req, res, (err: any) => {
    if (err) {
      return next(err);
    }
    req.rawBody = req.body;
    next();
  });
}
