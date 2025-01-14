import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from "@nestjs/common";
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{rawBody:true});
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.use(
    '/stripe/webhook',
    bodyParser.raw({type: "*/*"}),
  );
  await app.listen(5000,()=>console.log('Server started on port 5000!'));
}
bootstrap();
