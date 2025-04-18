import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config({ path: path.resolve(__dirname, '@/.env') });

async function bootstrap() {
  // 로깅 설정 추가
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // 전역 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:7777', 'https://pet.metashopping.kr'],
    credentials: true,
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Petbility API')
    .setDescription('Petbility 백엔드 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `Swagger documentation is available at: http://localhost:${port}/api`,
  );
}
bootstrap();
