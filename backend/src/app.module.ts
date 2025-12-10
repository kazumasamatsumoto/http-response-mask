import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { SecureErrorMaskingInterceptor } from './secure-error-masking.interceptor';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SecureErrorMaskingInterceptor,
    },
  ],
})
export class AppModule {}
