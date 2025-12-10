import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private http = inject(HttpClient);

  title = 'セキュリティを考慮したエラーレスポンス隠匿デモ';
  loading = false;
  errorResponse: any = null;
  successResponse: any = null;

  // バックエンドURL
  private apiUrl = 'http://localhost:3000/api';

  /**
   * 成功するAPIを呼び出す
   */
  callSuccessApi() {
    this.callApi('success');
  }

  /**
   * 400エラー（バリデーションエラー） → 500に変換される
   */
  call400() {
    this.callApi('error/400');
  }

  /**
   * 401エラー（未認証） → そのまま返る
   */
  call401() {
    this.callApi('error/401');
  }

  /**
   * 403エラー（権限なし） → そのまま返る
   */
  call403() {
    this.callApi('error/403');
  }

  /**
   * 404エラー（Not Found） → そのまま返る
   */
  call404() {
    this.callApi('error/404');
  }

  /**
   * 409エラー（競合） → 500に変換される
   */
  call409() {
    this.callApi('error/409');
  }

  /**
   * 422エラー（ビジネスロジック） → 500に変換される
   */
  call422() {
    this.callApi('error/422');
  }

  /**
   * 共通のAPI呼び出し処理
   */
  private callApi(endpoint: string) {
    this.loading = true;
    this.errorResponse = null;
    this.successResponse = null;

    this.http.get(`${this.apiUrl}/${endpoint}`).subscribe({
      next: (response) => {
        this.successResponse = response;
        this.loading = false;
      },
      error: (error) => {
        console.log('🔴 ブラウザで受け取ったエラー:', error);
        this.errorResponse = {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message || error.message,
          fullError: error.error,
        };
        this.loading = false;
      },
    });
  }

  /**
   * リセット
   */
  reset() {
    this.loading = false;
    this.errorResponse = null;
    this.successResponse = null;
  }
}
