import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * リクエスト受信時のインターセプター
 *
 * 【動作タイミング】
 * コントローラー実行「前」に処理される
 *
 * 【用途例】
 * - リクエストログの記録
 * - 認証情報の検証
 * - リクエストボディの変換
 * - タイムスタンプの記録
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    console.log('========================================');
    console.log('📥 リクエスト受信時の処理');
    console.log('メソッド:', request.method);
    console.log('URL:', request.url);
    console.log('受信時刻:', new Date().toISOString());
    console.log('========================================');

    // next.handle()を呼ぶことでコントローラーに処理を渡す
    return next.handle();
  }
}
