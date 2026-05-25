import { Component, inject, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styles: [],
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isDarkMode = signal<boolean>(true);

  constructor() {
    // Sync dark mode signal with body classes on start
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;

    this.isDarkMode.set(isDark);

    // Apply standard Tailwind class toggle
    effect(() => {
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-slate-950', 'text-slate-100');
        document.body.classList.remove('bg-slate-50', 'text-slate-900');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('bg-slate-50', 'text-slate-900');
        document.body.classList.remove('bg-slate-950', 'text-slate-100');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update((prev) => !prev);
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
