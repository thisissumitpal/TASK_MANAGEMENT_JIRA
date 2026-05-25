import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IComment {
  task: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
}

export interface ICommentDocument extends IComment, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<ICommentDocument>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Comment must belong to a task'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must belong to a user'],
    },
    content: {
      type: String,
      required: [true, 'Please provide comment text'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment: Model<ICommentDocument> = mongoose.model<ICommentDocument>(
  'Comment',
  commentSchema
);

export default Comment;
