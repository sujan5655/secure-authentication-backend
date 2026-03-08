import { Schema, model, Document } from "mongoose";

export interface ISession extends Document {
  sessionId: string;
  userId: string;
  deviceId: string;
  userAgent: string;
  ip: string;
  location: string;
  browser: string;
  os: string;
  deviceType: string;
  lastActive: Date;
  created_at: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
    location: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    deviceType: { type: String, default: "Desktop" },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

SessionSchema.index({ userId: 1, lastActive: -1 });

export const Session = model<ISession>("Session", SessionSchema);
