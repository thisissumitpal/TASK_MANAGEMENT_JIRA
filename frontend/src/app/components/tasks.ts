import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService, Task } from '../services/task.service';
import { AuthService, User } from '../services/auth.service';
import { NavbarComponent } from './navbar';
import { NgClass, DatePipe } from '@angular/common';

@Component({
  selector: 'app-tasks',
  imports: [NavbarComponent, RouterLink, ReactiveFormsModule, NgClass, DatePipe],
  templateUrl: './tasks.html',
  styles: [],
})
export class TasksComponent implements OnInit {
  taskService = inject(TaskService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // States
  tasksList = signal<Task[]>([]);
  usersList = signal<User[]>([]);
  viewMode = signal<'board' | 'list'>('board');
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filter States
  searchQuery = signal<string>('');
  statusFilter = signal<string>('');
  priorityFilter = signal<string>('');
  assigneeFilter = signal<string>('');
  sortByDueDate = signal<string>(''); // 'asc', 'desc', or ''

  // Modal Form States
  isCreateModalOpen = signal<boolean>(false);
  isFormSubmitting = signal<boolean>(false);
  taskForm!: FormGroup;

  // Board columns helper
  boardColumns: { id: string; name: string; dotClass: string; tasks: Task[] }[] = [];

  ngOnInit(): void {
    this.loadTasks();
    this.loadUsers();
    this.initTaskForm();
  }

  initTaskForm(): void {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['Todo'],
      priority: ['Medium'],
      assignee: [''],
      dueDate: [''],
      labelsInput: [''],
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const filterPayload: any = {};
    if (this.searchQuery()) filterPayload.search = this.searchQuery();
    if (this.statusFilter()) filterPayload.status = this.statusFilter();
    if (this.assigneeFilter()) filterPayload.assignee = this.assigneeFilter();
    if (this.priorityFilter()) filterPayload.priority = this.priorityFilter();

    if (this.sortByDueDate()) {
      filterPayload.sortBy = 'dueDate';
      filterPayload.sortOrder = this.sortByDueDate();
    }

    this.taskService.getTasks(filterPayload).subscribe({
      next: (res) => {
        this.tasksList.set(res.data);
        this.buildBoardColumns();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching tasks', err);
        let msg = 'Failed to load task board';
        if (err.error && err.error.message) msg = err.error.message;
        this.error.set(msg);
        this.isLoading.set(false);
      },
    });
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (res) => {
        this.usersList.set(res.data);
      },
      error: (err) => {
        console.error('Failed to load user directories', err);
      },
    });
  }

  buildBoardColumns(): void {
    const list = this.tasksList();
    this.boardColumns = [
      {
        id: 'Todo',
        name: 'To Do',
        dotClass: 'bg-slate-400',
        tasks: list.filter((t) => t.status === 'Todo'),
      },
      {
        id: 'In Progress',
        name: 'In Progress',
        dotClass: 'bg-indigo-500',
        tasks: list.filter((t) => t.status === 'In Progress'),
      },
      {
        id: 'Review',
        name: 'In Review',
        dotClass: 'bg-amber-500',
        tasks: list.filter((t) => t.status === 'Review'),
      },
      {
        id: 'Done',
        name: 'Done',
        dotClass: 'bg-emerald-500',
        tasks: list.filter((t) => t.status === 'Done'),
      },
    ];
  }

  // Filter Event Handlers
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.loadTasks();
  }

  onStatusFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(val);
    this.loadTasks();
  }

  onPriorityFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.priorityFilter.set(val);
    this.loadTasks();
  }

  onAssigneeFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.assigneeFilter.set(val);
    this.loadTasks();
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.sortByDueDate.set(val);
    this.loadTasks();
  }

  setViewMode(mode: 'board' | 'list'): void {
    this.viewMode.set(mode);
  }

  // Modal controls
  openCreateModal(): void {
    this.initTaskForm();
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onCreateTaskSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isFormSubmitting.set(true);

    const formVal = this.taskForm.value;

    // Parse labels list
    const labels = formVal.labelsInput
      ? formVal.labelsInput
          .split(',')
          .map((l: string) => l.trim())
          .filter((l: string) => l !== '')
      : [];

    // Sanitize assignee: ensure empty/undefined/"undefined" values become null
    let assigneeVal = formVal.assignee;
    if (!assigneeVal || assigneeVal === 'undefined' || assigneeVal === '') {
      assigneeVal = null;
    }

    const payload: Partial<Task> = {
      title: formVal.title,
      description: formVal.description,
      status: formVal.status,
      priority: formVal.priority,
      assignee: assigneeVal,
      dueDate: formVal.dueDate || null,
      labels: labels,
    };

    this.taskService.createTask(payload).subscribe({
      next: () => {
        this.isFormSubmitting.set(false);
        this.closeCreateModal();
        this.loadTasks(); // refresh task boards
      },
      error: (err) => {
        console.error('Failed to create task', err);
        this.isFormSubmitting.set(false);
        alert(err.error?.message || 'Error occurred while creating task');
      },
    });
  }
}
