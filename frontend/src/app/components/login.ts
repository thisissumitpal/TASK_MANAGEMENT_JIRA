import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './login.html',
  styles: [],
})
export class LoginComponent {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoginMode = signal<boolean>(true);
  authForm!: FormGroup;

  constructor() {
    this.initForm();
  }

  initForm(): void {
    if (this.isLoginMode()) {
      this.authForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    } else {
      this.authForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        role: ['Member'],
      });
    }
  }

  toggleMode(): void {
    this.isLoginMode.update((prev) => !prev);
    this.initForm();
    this.authService.error.set(null); // Clear errors
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.authForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    const payload = this.authForm.value;

    if (this.isLoginMode()) {
      this.authService.login(payload).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
      });
    } else {
      this.authService.register(payload).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
      });
    }
  }
}
