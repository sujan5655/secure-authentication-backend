"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = require("mongoose");
const SessionSchema = new mongoose_1.Schema({
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
}, {
    timestamps: { createdAt: "created_at", updatedAt: false },
});
SessionSchema.index({ userId: 1, lastActive: -1 });
exports.Session = (0, mongoose_1.model)("Session", SessionSchema);
