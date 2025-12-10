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
 * セキュリティを考慮したエラーマスキングインターセプター
 *
 * 【設計思想】
 * フロントエンドにエラーの原因を探られないようにする
 *
 * 【隠匿するエラー】（500に変換）
 * - 400 Bad Request          → バリデーションルールが露出
 * - 409 Conflict             → データ制約が露出
 * - 422 Unprocessable Entity → ビジネスルールが露出
 * - その他の4xx系            → 内部実装の推測材料になる
 *
 * 【そのまま返すエラー】
 * - 401 Unauthorized  → ログイン画面へのリダイレクトに必要
 * - 403 Forbidden     → 権限エラーの明示に必要
 * - 404 Not Found     → リソース不在は攻撃材料にならない
 * - 5xx系             → すでに詳細情報は含まれていない
 */
@Injectable()
export class SecureErrorMaskingInterceptor implements NestInterceptor {
  // そのまま返すステータスコード（クライアント側の動作に必要）
  private readonly ALLOWED_STATUS_CODES = [401, 403, 404];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // エラー情報を必ずサーバー側のログに記録（障害調査用）
        this.logError(error);

        // HttpExceptionでない場合はそのまま返す（予期せぬエラー）
        if (!(error instanceof HttpException)) {
          return throwError(() => error);
        }

        const status = error.getStatus();

        // 401, 403, 404 はそのまま返す（クライアント側の動作に必要）
        if (this.ALLOWED_STATUS_CODES.includes(status)) {
          console.log(`✅ ステータス ${status} はそのままクライアントに返却します`);
          return throwError(() => error);
        }

        // 500番台はそのまま返す（すでに詳細情報は含まれていない）
        if (status >= 500) {
          console.log(`✅ ステータス ${status} (サーバーエラー) はそのまま返却します`);
          return throwError(() => error);
        }

        // 400番台（401, 403, 404以外）は500に変換して隠匿
        if (status >= 400 && status < 500) {
          console.log(`🔒 ステータス ${status} を 500 に変換して隠匿します`);
          console.log('========================================');
          return throwError(
            () =>
              new InternalServerErrorException({
                statusCode: 500,
                message: 'サーバーエラーが発生しました',
                error: 'Internal Server Error',
                // 元のエラー詳細は一切含めない
              }),
          );
        }

        // それ以外はそのまま返す
        return throwError(() => error);
      }),
    );
  }

  /**
   * エラーログを記録（障害調査用）
   */
  private logError(error: any): void {
    console.log('========================================');
    console.log('🔍 エラー発生（サーバー側ログ）');
    console.log('時刻:', new Date().toISOString());

    if (error instanceof HttpException) {
      console.log('ステータスコード:', error.getStatus());
      console.log('エラーレスポンス:', error.getResponse());
    } else {
      console.log('予期せぬエラー:', error.message);
      console.log('スタックトレース:', error.stack);
    }

    console.log('========================================');
  }
}
