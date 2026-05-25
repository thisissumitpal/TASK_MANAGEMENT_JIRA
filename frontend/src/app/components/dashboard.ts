import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskService, DashboardMetrics } from '../services/task.service';
import { AuthService } from '../services/auth.service';
import { NavbarComponent } from './navbar';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  taskService = inject(TaskService);
  authService = inject(AuthService);

  metrics = signal<DashboardMetrics | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.taskService.getDashboardMetrics().subscribe({
      next: (res) => {
        this.metrics.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching metrics', err);
        let msg = 'Failed to retrieve dashboard analytics';
        if (err.error && err.error.message) msg = err.error.message;
        this.error.set(msg);
        this.isLoading.set(false);
      },
    });
  }
}
