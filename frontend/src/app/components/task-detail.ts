import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService, Task, Comment } from '../services/task.service';
import { AuthService, User } from '../services/auth.service';
import { NavbarComponent } from './navbar';
import { NgClass, DatePipe } from '@angular/common';

@Component({
  selector: 'app-task-detail',
  imports: [NavbarComponent, RouterLink, ReactiveFormsModule, NgClass, DatePipe],
  templateUrl: './task-detail.html',
  styles: [],
})
export class TaskDetailComponent implements OnInit {
  taskService = inject(TaskService);
  authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals
  task = signal<Task | null>(null);
  usersList = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Comment Box Forms
  commentForm!: FormGroup;
  isPostingComment = signal<boolean>(false);

  // Comment Editing States
  editingCommentId = signal<string | null>(null);
  editingCommentText = signal<string>('');

  // Task Editing States
  isEditing = signal<boolean>(false);
  isSubmittingEdit = signal<boolean>(false);
  editForm!: FormGroup;

  // Authorization Computeds
  canEdit = signal<boolean>(false);
  isFullEditor = signal<boolean>(false);
  canDelete = signal<boolean>(false);

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      content: ['', Validators.required],
    });
    this.loadTaskDetails();
    this.loadUsers();
  }

  loadTaskDetails(): void {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (!taskId) {
      this.error.set('Task ID is missing');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.taskService.getTaskById(taskId).subscribe({
      next: (res) => {
        this.task.set(res.data);
        this.evaluatePermissions();
        this.initEditForm();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching task details', err);
        let msg = 'Failed to load task details';
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

  evaluatePermissions(): void {
    const t = this.task();
    const currentUser = this.authService.currentUser();
    if (!t || !currentUser) return;

    const isAdmin = currentUser.role === 'Admin';
    const isCreator = t.createdBy._id === currentUser.id || t.createdBy.id === currentUser.id;
    const isAssignee = t.assignee && (t.assignee._id === currentUser.id || t.assignee.id === currentUser.id);

    // Can Delete: Admin OR Creator
    this.canDelete.set(isAdmin || isCreator);

    // Can Edit: Admin OR Creator OR Assignee
    this.canEdit.set(isAdmin || isCreator || !!isAssignee);

    // Is Full Editor: Admin OR Creator (can edit title, desc, assignee, priority etc)
    // If Assignee only, can ONLY edit Status.
    this.isFullEditor.set(isAdmin || isCreator);
  }

  initEditForm(): void {
    const t = this.task();
    if (!t) return;

    // Convert date string for input tag (YYYY-MM-DD)
    let formattedDate = '';
    if (t.dueDate) {
      const dateObj = new Date(t.dueDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0];
      }
    }

    this.editForm = this.fb.group({
      title: [t.title, Validators.required],
      description: [t.description || ''],
      status: [t.status],
      priority: [t.priority],
      assignee: [t.assignee ? (t.assignee._id || t.assignee.id) : ''],
      dueDate: [formattedDate],
      labelsInput: [t.labels.join(', ')],
    });
  }

  toggleEditMode(): void {
    this.isEditing.update((v) => !v);
    if (this.isEditing()) {
      this.initEditForm();
    }
  }

  onEditSubmit(): void {
    const t = this.task();
    if (!t || this.editForm.invalid) return;

    this.isSubmittingEdit.set(true);

    const formVal = this.editForm.value;
    let payload: Partial<Task> = {};

    if (this.isFullEditor()) {
      const labels = formVal.labelsInput
        ? formVal.labelsInput
            .split(',')
            .map((l: string) => l.trim())
            .filter((l: string) => l !== '')
        : [];

      // Sanitize assignee value
      let assigneeVal = formVal.assignee;
      if (!assigneeVal || assigneeVal === 'undefined' || assigneeVal === '') {
        assigneeVal = null;
      }

      payload = {
        title: formVal.title,
        description: formVal.description,
        status: formVal.status,
        priority: formVal.priority,
        assignee: assigneeVal,
        dueDate: formVal.dueDate || null,
        labels: labels,
      };
    } else {
      // Assignee only: CAN ONLY edit status
      payload = {
        status: formVal.status,
      };
    }

    this.taskService.updateTask(t._id || t.id || '', payload).subscribe({
      next: (res) => {
        this.task.set(res.data);
        this.isEditing.set(false);
        this.isSubmittingEdit.set(false);
        this.evaluatePermissions();
      },
      error: (err) => {
        console.error('Failed to update task', err);
        this.isSubmittingEdit.set(false);
        alert(err.error?.message || 'Error occurred while updating task');
      },
    });
  }

  deleteTask(): void {
    const t = this.task();
    if (!t) return;

    if (confirm('Are you absolutely sure you want to delete this task? This action cannot be undone.')) {
      this.taskService.deleteTask(t._id || t.id || '').subscribe({
        next: () => {
          this.router.navigate(['/tasks']);
        },
        error: (err) => {
          console.error('Failed to delete task', err);
          alert(err.error?.message || 'Failed to delete task');
        },
      });
    }
  }

  // Comments Submission
  onCommentSubmit(): void {
    const t = this.task();
    if (!t || this.commentForm.invalid) return;

    this.isPostingComment.set(true);
    const content = this.commentForm.value.content;

    this.taskService.addComment(t._id || t.id || '', content).subscribe({
      next: (res) => {
        // Add new comment locally without reloading the whole page!
        const updatedTask = { ...t };
        if (!updatedTask.comments) updatedTask.comments = [];
        updatedTask.comments = [...updatedTask.comments, res.data];

        this.task.set(updatedTask);
        this.commentForm.reset();
        this.isPostingComment.set(false);
      },
      error: (err) => {
        console.error('Failed to add comment', err);
        this.isPostingComment.set(false);
        alert(err.error?.message || 'Failed to post comment');
      },
    });
  }

  // Comment Editing operations
  startCommentEdit(commentId: string, currentText: string): void {
    this.editingCommentId.set(commentId);
    this.editingCommentText.set(currentText);
  }

  cancelCommentEdit(): void {
    this.editingCommentId.set(null);
    this.editingCommentText.set('');
  }

  onEditCommentTextInput(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.editingCommentText.set(text);
  }

  submitCommentEdit(commentId: string): void {
    const t = this.task();
    const content = this.editingCommentText().trim();
    if (!t || !content) return;

    this.taskService.editComment(commentId, content).subscribe({
      next: (res) => {
        // Update comments local list
        const updatedTask = { ...t };
        if (updatedTask.comments) {
          updatedTask.comments = updatedTask.comments.map((c) =>
            c._id === commentId ? { ...c, content: res.data.content, updatedAt: res.data.updatedAt } : c
          );
        }
        this.task.set(updatedTask);
        this.cancelCommentEdit();
      },
      error: (err) => {
        console.error('Failed to edit comment', err);
        alert(err.error?.message || 'Failed to update comment');
      },
    });
  }

  deleteComment(commentId: string): void {
    const t = this.task();
    if (!t) return;

    if (confirm('Are you sure you want to delete this comment?')) {
      this.taskService.deleteComment(commentId).subscribe({
        next: () => {
          // Remove comment from local list
          const updatedTask = { ...t };
          if (updatedTask.comments) {
            updatedTask.comments = updatedTask.comments.filter((c) => c._id !== commentId);
          }
          this.task.set(updatedTask);
        },
        error: (err) => {
          console.error('Failed to delete comment', err);
          alert(err.error?.message || 'Failed to delete comment');
        },
      });
    }
  }
}
