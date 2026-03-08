import { Schema, model, Document } from "mongoose";

export interface IActivity extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  description: string;
  ipAddress: string | null;
  location: string | null;
  metadata?: Record<string, any>;
  created_at: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    userEmail: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// Index for faster queries
ActivitySchema.index({ userId: 1, created_at: -1 });
ActivitySchema.index({ created_at: -1 });

export const Activity = model<IActivity>("Activity", ActivitySchema);

