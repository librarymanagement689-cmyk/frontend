import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  admin_email: string;
}

export interface AdminProfile {
  email: string;
  name: string;
}

const TOKEN_KEY = 'skl_admin_token';
const ADMIN_EMAIL_KEY = 'skl_admin_email';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  token = signal<string | null>(this.getStoredToken());
  adminEmail = signal<string | null>(localStorage.getItem(ADMIN_EMAIL_KEY));

  login(credentials: { email: string; password: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (res.access_token) {
          this.setSession(res.access_token, res.admin_email);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
    this.token.set(null);
    this.adminEmail.set(null);
  }

  isLoggedIn(): boolean {
    return !!this.token();
  }

  getToken(): string | null {
    return this.token();
  }

  getProfile(): Observable<AdminProfile> {
    return this.http.get<AdminProfile>(`${environment.apiUrl}/auth/me`);
  }

  private setSession(accessToken: string, email: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(ADMIN_EMAIL_KEY, email);
    this.token.set(accessToken);
    this.adminEmail.set(email);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
