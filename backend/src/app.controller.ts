import {
  Controller,
  Get,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  UseInterceptors,
} from '@nestjs/common';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { ResponseLoggingInterceptor } from './response-logging.interceptor';

@Controller('api')
export class AppController {
  @Get('success')
  success() {
    return {
      message: '成功しました',
      data: { result: 'OK' },
    };
  }

  // === インターセプター分離のテスト ===

  @Get('interceptor-test')
  @UseInterceptors(RequestLoggingInterceptor, ResponseLoggingInterceptor)
  interceptorTest() {
    console.log('🎯 コントローラー内の処理');
    return {
      message: 'インターセプターのライフサイクルテスト',
      timestamp: new Date().toISOString(),
    };
  }

  // === 隠匿されるエラー（500に変換） ===

  @Get('error/400')
  test400() {
    // バリデーションエラー → 隠匿すべき
    throw new BadRequestException({
      statusCode: 400,
      message: 'バリデーションエラー',
      error: 'Bad Request',
      details: {
        validationErrors: ['email形式が不正です', 'パスワードが短すぎます'],
        userId: '12345',
        internalRule: 'パスワードは8文字以上、大文字小文字数字を含む必要があります',
      },
    });
  }

  @Get('error/409')
  test409() {
    // 競合エラー → データ制約が露出するので隠匿
    throw new ConflictException({
      statusCode: 409,
      message: 'ユーザーがすでに存在します',
      error: 'Conflict',
      details: {
        existingEmail: 'user@example.com',
        databaseConstraint: 'unique_email_constraint',
      },
    });
  }

  @Get('error/422')
  test422() {
    // ビジネスロジックエラー → ビジネスルールが露出するので隠匿
    throw new UnprocessableEntityException({
      statusCode: 422,
      message: 'ビジネスルール違反',
      error: 'Unprocessable Entity',
      details: {
        reason: '未成年はこの操作を実行できません',
        age: 17,
        requiredAge: 18,
      },
    });
  }

  // === そのまま返すエラー（クライアント側の動作に必要） ===

  @Get('error/401')
  test401() {
    // 未認証 → ログイン画面へのリダイレクトに必要
    throw new UnauthorizedException({
      statusCode: 401,
      message: '認証が必要です',
      error: 'Unauthorized',
    });
  }

  @Get('error/403')
  test403() {
    // 権限なし → 権限エラーの明示に必要
    throw new ForbiddenException({
      statusCode: 403,
      message: 'この操作を実行する権限がありません',
      error: 'Forbidden',
    });
  }

  @Get('error/404')
  test404() {
    // リソース不在 → 攻撃材料にならない
    throw new NotFoundException({
      statusCode: 404,
      message: 'リソースが見つかりません',
      error: 'Not Found',
    });
  }
}
