import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * エラーマスキングインターセプター
 *
 * 【目的】
 * 本来は400エラーだが、クライアント側には500エラーとして見せることで
 * エラーの詳細情報を隠匿する
 *
 * 【動作】
 * - 400番台のエラーをキャッチ
 * - 500 Internal Server Errorに変換
 * - クライアントには詳細なエラー情報を見せない
 */
@Injectable()
export class ErrorMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        console.log('========================================');
        console.log('🔍 元のエラー情報（サーバー側ログ）:');
        console.log('ステータスコード:', error.status);
        console.log('エラーレスポンス:', error.response);
        console.log('========================================');

        // 400番台のエラーの場合、500に変換
        if (error instanceof HttpException && error.getStatus() >= 400 && error.getStatus() < 500) {
          console.log('⚠️  400番台のエラーを検知しました');
          console.log('💡 クライアントには500エラーとして返却します');
          console.log('========================================');

          // 500エラーに変換（詳細情報を隠匿）
          return throwError(
            () =>
              new InternalServerErrorException({
                statusCode: 500,
                message: 'サーバーエラーが発生しました',
                error: 'Internal Server Error',
                // 元のエラー詳細は含めない
              }),
          );
        }

        // それ以外のエラーはそのまま返す
        return throwError(() => error);
      }),
    );
  }
}
