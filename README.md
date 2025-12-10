# エラーレスポンス隠匿デモ（Angular + NestJS）

## 📖 このプロジェクトについて

このプロジェクトは、**バックエンドで発生した400エラーをクライアント側には500エラーとして返す**ことで、エラーの詳細情報を隠匿する技術のデモアプリケーションです。

### なぜこれが必要なのか？

通常、バックエンドで発生したエラー（例：バリデーションエラー、認証エラーなど）をそのままクライアントに返すと、以下のような問題があります：

- **セキュリティリスク**: エラーの詳細情報から内部実装が推測される
- **情報漏洩**: バリデーションルールや内部データ構造が露出する
- **攻撃の手がかり**: 攻撃者に有益な情報を与えてしまう

このデモでは、**NestJSのインターセプター**を使用して400番台のエラーを500エラーに変換し、詳細情報を隠匿します。

## 🏗️ プロジェクト構成

```
http-response/
├── backend/          # NestJSバックエンド
│   ├── src/
│   │   ├── main.ts                      # エントリーポイント
│   │   ├── app.module.ts                # アプリケーションモジュール
│   │   ├── app.controller.ts            # APIエンドポイント（400エラーを返す）
│   │   └── error-masking.interceptor.ts # エラー変換インターセプター（核心部分）
│   └── package.json
│
├── frontend/         # Angularフロントエンド
│   ├── src/
│   │   ├── main.ts
│   │   ├── index.html
│   │   └── app/
│   │       ├── app.component.ts         # メインコンポーネント
│   │       ├── app.component.html       # テンプレート
│   │       └── app.component.css        # スタイル
│   └── package.json
│
└── README.md         # このファイル
```

## 🚀 実行方法

### 前提条件

- Node.js 18以上
- npm

### 1. バックエンドの起動

```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール（初回のみ）
npm install

# サーバーを起動
npm start
```

バックエンドが `http://localhost:3000` で起動します。

### 2. フロントエンドの起動

**別のターミナル**を開いて以下を実行：

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール（初回のみ）
npm install

# 開発サーバーを起動
npm start
```

フロントエンドが `http://localhost:4200` で起動します。

### 3. ブラウザでアクセス

ブラウザで `http://localhost:4200` を開きます。

## 🔍 動作確認手順

1. ブラウザで `http://localhost:4200` を開く
2. ブラウザの開発者ツール（F12キー）を開く
3. **Networkタブ**を選択
4. 「**400エラーを発生させる（→500に変換される）**」ボタンをクリック
5. Networkタブで `test-error` のリクエストを確認
6. **ステータスコードが500になっていることを確認**
7. バックエンドのコンソール（ターミナル）を確認
8. **元の400エラー情報がサーバー側のログに記録されていることを確認**

### 確認ポイント

#### ブラウザ側（クライアント）
- ステータスコード: **500 Internal Server Error**
- エラーメッセージ: 「サーバーエラーが発生しました」（一般的なメッセージのみ）
- 詳細なバリデーションエラーは**表示されない**

#### サーバー側（バックエンド）
コンソールに以下のような詳細ログが出力されます：

```
========================================
🔍 元のエラー情報（サーバー側ログ）:
ステータスコード: 400
エラーレスポンス: {
  statusCode: 400,
  message: 'これは本来の400エラーです（Bad Request）',
  error: 'Bad Request',
  details: {
    validationErrors: ['email形式が不正です', 'パスワードが短すぎます'],
    userId: '12345',
    timestamp: '...'
  }
}
========================================
⚠️  400番台のエラーを検知しました
💡 クライアントには500エラーとして返却します
========================================
```

## 💡 技術的な仕組み

### バックエンド（NestJS）

#### 1. エンドポイント（`app.controller.ts`）

```typescript
@Get('test-error')
testError() {
  // 400エラーを投げる
  throw new BadRequestException({
    statusCode: 400,
    message: 'これは本来の400エラーです（Bad Request）',
    error: 'Bad Request',
    details: {
      validationErrors: ['email形式が不正です', 'パスワードが短すぎます'],
      userId: '12345',
      timestamp: new Date().toISOString(),
    },
  });
}
```

#### 2. エラー変換インターセプター（`error-masking.interceptor.ts`）

NestJSのインターセプターを使用して、すべてのレスポンスを監視し、400番台のエラーを500エラーに変換します。

```typescript
@Injectable()
export class ErrorMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // 元のエラーをサーバー側でログに記録
        console.log('元のエラー情報:', error);

        // 400番台のエラーの場合、500に変換
        if (error instanceof HttpException && error.getStatus() >= 400 && error.getStatus() < 500) {
          return throwError(
            () => new InternalServerErrorException({
              statusCode: 500,
              message: 'サーバーエラーが発生しました',
              error: 'Internal Server Error',
            }),
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
```

#### 3. モジュール設定（`app.module.ts`）

インターセプターをグローバルに適用します。

```typescript
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorMaskingInterceptor,
    },
  ],
})
export class AppModule {}
```

### フロントエンド（Angular）

HttpClientを使用してAPIを呼び出し、エラーハンドリングを行います。

```typescript
this.http.get(`${this.apiUrl}/test-error`).subscribe({
  next: (response) => {
    this.successResponse = response;
  },
  error: (error) => {
    console.log('ブラウザで受け取ったエラー:', error);
    this.errorResponse = {
      status: error.status,        // 500
      statusText: error.statusText, // Internal Server Error
      message: error.error?.message // サーバーエラーが発生しました
    };
  },
});
```

## 🔐 セキュリティ上の利点

1. **バリデーションエラーの隠匿**
   - クライアントには「サーバーエラー」としか見えない
   - 内部のバリデーションルールが露出しない

2. **内部実装の保護**
   - エラーメッセージから内部構造を推測できない
   - データベーススキーマなどの情報が漏れない

3. **攻撃者への情報提供を最小化**
   - 攻撃者が得られる情報を最小限に抑える
   - セキュリティホールを探る手がかりを与えない

## 📝 実際の運用での応用

このデモでは400番台すべてを500に変換していますが、実際の運用では以下のようにカスタマイズできます：

### 例1: 特定のエラーのみ隠匿

```typescript
// 401（認証エラー）と403（認可エラー）のみ変換
if (error.getStatus() === 401 || error.getStatus() === 403) {
  return throwError(() => new InternalServerErrorException(...));
}
```

### 例2: 環境によって動作を変える

```typescript
// 本番環境のみ隠匿、開発環境はそのまま
if (process.env.NODE_ENV === 'production' && error.getStatus() >= 400 && error.getStatus() < 500) {
  return throwError(() => new InternalServerErrorException(...));
}
```

### 例3: ログ記録を強化

```typescript
// エラーをログサービスに送信
this.loggerService.error('Original error:', {
  status: error.getStatus(),
  message: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
});
```

## ⚠️ 注意事項

- このアプローチは**セキュリティ対策の一部**であり、これだけで完全に安全になるわけではありません
- すべてのエラーを500に変換すると、デバッグが困難になる可能性があります
- 開発環境と本番環境で動作を変えることを推奨します
- サーバー側でのログ記録は必須です（障害調査のため）

## 🛠️ 開発環境

- Node.js: 18.x以上
- NestJS: 11.x
- Angular: 21.x
- TypeScript: 5.x

## 📚 参考リソース

- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [Angular HttpClient](https://angular.dev/guide/http)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
