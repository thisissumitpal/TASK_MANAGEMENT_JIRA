import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';

export interface Comment {
  _id: string;
  task: string;
  user: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  assignee: User | null;
  status: 'Todo' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string | null;
  createdBy: User;
  labels: string[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  completedPercentage: number;
  assignedToMe: number;
  byStatus: {
    Todo: number;
    'In Progress': number;
    Review: number;
    Done: number;
  };
  byPriority: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
  recentTasks: Task[];
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5001/api';

  
  getTasks(filters?: {
    search?: string;
    status?: string;
    assignee?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Observable<{
    success: boolean;
    count: number;
    pagination: { total: number; page: number; pages: number };
    data: Task[];
  }> {
    let params = new HttpParams();

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.assignee) params = params.set('assignee', filters.assignee);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<{
      success: boolean;
      count: number;
      pagination: { total: number; page: number; pages: number };
      data: Task[];
    }>(`${this.apiUrl}/tasks`, { params });
  }

  // Get single task details
  getTaskById(id: string): Observable<{ success: boolean; data: Task }> {
    return this.http.get<{ success: boolean; data: Task }>(`${this.apiUrl}/tasks/${id}`);
  }

  // Get dashboard metrics
  getDashboardMetrics(): Observable<{ success: boolean; data: DashboardMetrics }> {
    return this.http.get<{ success: boolean; data: DashboardMetrics }>(`${this.apiUrl}/tasks/dashboard`);
  }

  // Create a new task
  createTask(taskData: Partial<Task>): Observable<{ success: boolean; data: Task }> {
    return this.http.post<{ success: boolean; data: Task }>(`${this.apiUrl}/tasks`, taskData);
  }

  
  updateTask(id: string, taskData: Partial<Task>): Observable<{ success: boolean; data: Task }> {
    return this.http.put<{ success: boolean; data: Task }>(`${this.apiUrl}/tasks/${id}`, taskData);
  }

  
  deleteTask(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/tasks/${id}`);
  }

  
  addComment(taskId: string, content: string): Observable<{ success: boolean; data: Comment }> {
    return this.http.post<{ success: boolean; data: Comment }>(`${this.apiUrl}/comments`, {
      taskId,
      content,
    });
  }

  
  editComment(commentId: string, content: string): Observable<{ success: boolean; data: Comment }> {
    return this.http.put<{ success: boolean; data: Comment }>(`${this.apiUrl}/comments/${commentId}`, {
      content,
    });
  }

  // Delete a comment
  deleteComment(commentId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/comments/${commentId}`);
  }
}
