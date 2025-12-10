import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * レスポンス送信時のインターセプター
 *
 * 【動作タイミング】
 * コントローラー実行「後」に処理される
 *
 * 【用途例】
 * - レスポンスログの記録
 * - レスポンスボディの変換
 * - キャッシュヘッダーの追加
 * - パフォーマンス測定
 */
@Injectable()
export class ResponseLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();

    // next.handle()の後のpipeで、レスポンス送信時の処理を記述
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;

        console.log('========================================');
        console.log('📤 レスポンス送信時の処理');
        console.log('ステータスコード:', response.statusCode);
        console.log('処理時間:', `${duration}ms`);
        console.log('レスポンスデータ:', JSON.stringify(data));
        console.log('送信時刻:', new Date().toISOString());
        console.log('========================================');
      }),
    );
  }
}
