import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5001/api';

  // Signals for state management
  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed signals
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  constructor() {
    this.loadSession();
  }

  // Load session from localStorage on startup
  private loadSession(): void {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  
  register(userData: any): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData).pipe(
      tap((res) => {
        this.saveSession(res.token, res.user);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  
  login(credentials: any): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        this.saveSession(res.token, res.user);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.handleError(err);
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  // Log out user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.currentUser.set(null);
  }

  
  private saveSession(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  
  getUsers(): Observable<{ success: boolean; count: number; data: User[] }> {
    return this.http.get<{ success: boolean; count: number; data: User[] }>(`${this.apiUrl}/users`).pipe(
      catchError((err) => {
        console.error('Error fetching users:', err);
        return throwError(() => err);
      })
    );
  }

  
  getProfile(): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/users/me`).pipe(
      tap((res) => {
        localStorage.setItem('user', JSON.stringify(res.data));
        this.currentUser.set(res.data);
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  
  private handleError(errorResponse: any): void {
    let message = 'An unknown error occurred';
    if (errorResponse.error && errorResponse.error.message) {
      message = errorResponse.error.message;
    } else if (errorResponse.error && errorResponse.error.errors) {
      // Validation error array
      message = errorResponse.error.errors.map((e: any) => e.message).join(', ');
    } else if (errorResponse.message) {
      message = errorResponse.message;
    }
    this.error.set(message);
  }
}
