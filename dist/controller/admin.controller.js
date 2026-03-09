"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = void 0;
const activity_model_1 = require("../database/models/activity.model");
const user_model_1 = require("../database/models/user.model");
const session_model_1 = require("../database/models/session.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "No token provided." });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default_secret");
        if (decoded.role !== "admin") {
            res.status(403).json({ message: "Access denied. Admin role required." });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Invalid or expired token." });
    }
};
exports.verifyAdmin = verifyAdmin;
class AdminController {
    // Get all activities
    getActivities(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 50, userId, action } = req.query;
                const query = {};
                if (userId)
                    query.userId = userId;
                if (action)
                    query.action = action;
                const skip = (Number(page) - 1) * Number(limit);
                const activities = yield activity_model_1.Activity.find(query)
                    .sort({ created_at: -1 })
                    .limit(Number(limit))
                    .skip(skip);
                const total = yield activity_model_1.Activity.countDocuments(query);
                res.json({
                    activities,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    },
                });
            }
            catch (error) {
                console.error("Error fetching activities:", error);
                res.status(500).json({ message: "Error fetching activities." });
            }
        });
    }
    // Get activity statistics
    getActivityStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalActivities = yield activity_model_1.Activity.countDocuments();
                const totalUsers = yield user_model_1.User.countDocuments({ role: "user" });
                // Get activities by action type
                const activitiesByAction = yield activity_model_1.Activity.aggregate([
                    {
                        $group: {
                            _id: "$action",
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { count: -1 } },
                ]);
                // Get recent activities (last 24 hours)
                const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const recentActivities = yield activity_model_1.Activity.countDocuments({
                    created_at: { $gte: last24Hours },
                });
                // Get activities by user
                const topUsers = yield activity_model_1.Activity.aggregate([
                    {
                        $group: {
                            _id: "$userEmail",
                            userName: { $first: "$userName" },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                ]);
                res.json({
                    totalActivities,
                    totalUsers,
                    recentActivities,
                    activitiesByAction,
                    topUsers,
                });
            }
            catch (error) {
                console.error("Error fetching activity stats:", error);
                res.status(500).json({ message: "Error fetching activity statistics." });
            }
        });
    }
    // Get all users (both user and admin roles for management)
    getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield user_model_1.User.find({})
                    .select("-password -otp -resetPasswordToken -passwordHistory")
                    .sort({ created_at: -1 });
                res.json({ users });
            }
            catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({ message: "Error fetching users." });
            }
        });
    }
    // Get all sessions (all users' devices) - admin only
    getAllSessions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessions = yield session_model_1.Session.find({}).sort({ lastActive: -1 }).lean();
                const userIds = [...new Set(sessions.map((s) => s.userId))];
                const users = yield user_model_1.User.find({ _id: { $in: userIds } })
                    .select("fullName email role")
                    .lean();
                const userMap = {};
                users.forEach((u) => {
                    userMap[u._id.toString()] = { fullName: u.fullName, email: u.email, role: u.role };
                });
                const list = sessions.map((s) => {
                    var _a, _b, _c, _d, _e, _f;
                    return ({
                        sessionId: s.sessionId,
                        userId: s.userId,
                        userName: (_b = (_a = userMap[s.userId]) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : "Unknown",
                        userEmail: (_d = (_c = userMap[s.userId]) === null || _c === void 0 ? void 0 : _c.email) !== null && _d !== void 0 ? _d : "",
                        userRole: (_f = (_e = userMap[s.userId]) === null || _e === void 0 ? void 0 : _e.role) !== null && _f !== void 0 ? _f : "user",
                        deviceType: s.deviceType,
                        browser: s.browser,
                        os: s.os,
                        ip: s.ip,
                        location: s.location,
                        lastActive: s.lastActive,
                        firstSeen: s.created_at,
                    });
                });
                res.json({
                    total: list.length,
                    sessions: list,
                });
            }
            catch (error) {
                console.error("Error fetching all sessions:", error);
                res.status(500).json({ message: "Error fetching sessions." });
            }
        });
    }
    updateUserRole(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { userId } = req.params;
                const { role } = req.body;
                if (!userId || !role) {
                    res.status(400).json({ message: "UserId and role are required." });
                    return;
                }
                if (!["user", "admin"].includes(role)) {
                    res.status(400).json({ message: "Role must be 'user' or 'admin'." });
                    return;
                }
                if (adminId === userId) {
                    res.status(403).json({ message: "You cannot change your own role." });
                    return;
                }
                const user = yield user_model_1.User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password -otp -resetPasswordToken -passwordHistory");
                if (!user) {
                    res.status(404).json({ message: "User not found." });
                    return;
                }
                res.json({ message: "User role updated successfully.", user });
            }
            catch (error) {
                console.error("Error updating user role:", error);
                res.status(500).json({ message: "Error updating user role." });
            }
        });
    }
}
exports.default = new AdminController();
