"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = void 0;
const mongoose_1 = require("mongoose");
const ActivitySchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: false,
    },
});
// Index for faster queries
ActivitySchema.index({ userId: 1, created_at: -1 });
ActivitySchema.index({ created_at: -1 });
exports.Activity = (0, mongoose_1.model)("Activity", ActivitySchema);
