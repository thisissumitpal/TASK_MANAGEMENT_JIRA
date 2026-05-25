import type { ICommentDocument } from '../models/Comment.js';
import type { IUserDocument } from '../models/User.js';
import type { ICommentRepository } from '../repositories/ICommentRepository.js';
import { commentRepository } from '../repositories/CommentRepository.js';
import type { ITaskRepository } from '../repositories/ITaskRepository.js';
import { taskRepository } from '../repositories/TaskRepository.js';

export class CommentServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'CommentServiceError';
  }
}

export class CommentService {
  constructor(
    private readonly comments: ICommentRepository = commentRepository,
    private readonly tasks: ITaskRepository = taskRepository
  ) {}

  private canAccessTask(
    task: { createdBy: { toString(): string }; assignee?: { toString(): string } | null },
    user: IUserDocument
  ): boolean {
    if (user.role === 'Admin') return true;
    const userId = user._id.toString();
    const isCreator = task.createdBy.toString() === userId;
    const isAssignee = task.assignee && task.assignee.toString() === userId;
    return isCreator || Boolean(isAssignee);
  }

  async addComment(
    user: IUserDocument,
    taskId: string,
    content: string
  ): Promise<ICommentDocument> {
    if (!taskId || !content) {
      throw new CommentServiceError('Please provide taskId and content', 400);
    }

    const task = await this.tasks.findById(taskId);
    if (!task) {
      throw new CommentServiceError('Task not found', 404);
    }

    if (!this.canAccessTask(task, user)) {
      throw new CommentServiceError('Not authorized to comment on this task', 403);
    }

    const comment = await this.comments.create({
      taskId,
      userId: user._id.toString(),
      content,
    });

    const populated = await this.comments.findByIdPopulated(comment._id.toString());
    if (!populated) {
      throw new CommentServiceError('Comment not found', 404);
    }
    return populated;
  }

  async editComment(
    user: IUserDocument,
    commentId: string,
    content: string
  ): Promise<ICommentDocument> {
    if (!content) {
      throw new CommentServiceError('Please provide comment text', 400);
    }

    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new CommentServiceError('Comment not found', 404);
    }

    if (comment.user.toString() !== user._id.toString()) {
      throw new CommentServiceError('Not authorized to edit this comment', 403);
    }

    const updated = await this.comments.updateContent(commentId, content);
    if (!updated) {
      throw new CommentServiceError('Comment not found', 404);
    }
    return updated;
  }

  async deleteComment(user: IUserDocument, commentId: string): Promise<void> {
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new CommentServiceError('Comment not found', 404);
    }

    if (
      comment.user.toString() !== user._id.toString() &&
      user.role !== 'Admin'
    ) {
      throw new CommentServiceError('Not authorized to delete this comment', 403);
    }

    await comment.deleteOne();
  }
}

export const commentService = new CommentService();
