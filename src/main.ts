import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ValidationPipe } from '@nestjs/common';

dotenv.config({ path: path.resolve(__dirname, '@/.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ 먼저 CORS 설정
  app.enableCors({
    origin: [process.env.FRONTEND_URL], // 예: http://localhost:7777
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Server is running on http://localhost:${port}`);
}
bootstrap();
