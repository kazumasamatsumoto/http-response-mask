import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS設定（Angularからのリクエストを許可）
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  await app.listen(3000);
  console.log('バックエンドサーバーが http://localhost:3000 で起動しました');
}
bootstrap();
