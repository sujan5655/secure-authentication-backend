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
const user_model_1 = require("../database/models/user.model");
const session_model_1 = require("../database/models/session.model");
const activity_model_1 = require("../database/models/activity.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
class DashboardController {
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const user = yield user_model_1.User.findById(userId)
                    .select("fullName email role created_at passwordExpiresAt passwordCreatedAt otpVerified");
                if (!user) {
                    res.status(404).json({ message: "User not found." });
                    return;
                }
                const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;
                res.json({
                    username: user.fullName,
                    email: user.email,
                    role: user.role,
                    memberSince,
                    passwordExpiresAt: user.passwordExpiresAt,
                    passwordCreatedAt: user.passwordCreatedAt,
                    emailVerified: !!user.otpVerified,
                });
            }
            catch (error) {
                console.error("getProfile error:", error);
                res.status(500).json({ message: "Error fetching profile." });
            }
        });
    }
    getSessions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const currentSessionId = req.query.currentSessionId || req.headers["x-session-id"];
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const sessions = yield session_model_1.Session.find({ userId }).sort({ lastActive: -1 });
                const total = sessions.length;
                const activeCount = sessions.filter((s) => {
                    const diff = Date.now() - new Date(s.lastActive).getTime();
                    return diff < 5 * 60 * 1000; // 5 min = active
                }).length;
                const list = sessions.map((s) => ({
                    sessionId: s.sessionId,
                    deviceType: s.deviceType,
                    browser: s.browser,
                    os: s.os,
                    ip: s.ip,
                    location: s.location,
                    firstSeen: s.created_at,
                    lastActive: s.lastActive,
                    isCurrent: s.sessionId === currentSessionId,
                }));
                res.json({
                    totalDevices: total,
                    activeNow: activeCount,
                    inactive: total - activeCount,
                    sessions: list,
                });
            }
            catch (error) {
                console.error("getSessions error:", error);
                res.status(500).json({ message: "Error fetching sessions." });
            }
        });
    }
    endOtherSessions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { keepSessionId } = req.body;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const filter = { userId };
                if (keepSessionId)
                    filter.sessionId = { $ne: keepSessionId };
                yield session_model_1.Session.deleteMany(filter);
                res.json({ message: "Other sessions ended successfully." });
            }
            catch (error) {
                console.error("endOtherSessions error:", error);
                res.status(500).json({ message: "Error ending sessions." });
            }
        });
    }
    getSecurityOverview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const user = yield user_model_1.User.findById(userId).select("failedAttempts passwordExpiresAt passwordCreatedAt otpVerified lastLoginIP lastLoginLocation");
                if (!user) {
                    res.status(404).json({ message: "User not found." });
                    return;
                }
                const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const [loginCount, failedCount] = yield Promise.all([
                    activity_model_1.Activity.countDocuments({ userId: userId.toString(), action: "LOGIN", created_at: { $gte: last24h } }),
                    activity_model_1.Activity.countDocuments({ userId: userId.toString(), action: "LOGIN_FAILED", created_at: { $gte: last24h } }),
                ]);
                const lastLogin = yield activity_model_1.Activity.findOne({ userId: userId.toString(), action: "LOGIN" })
                    .sort({ created_at: -1 }).select("created_at");
                const passwordExpiresAt = user.passwordExpiresAt ? new Date(user.passwordExpiresAt) : null;
                const daysUntilExpiry = passwordExpiresAt ? Math.max(0, Math.ceil((passwordExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : null;
                let securityScore = 100;
                if (user.failedAttempts > 0)
                    securityScore -= 10;
                if (!user.otpVerified)
                    securityScore -= 20;
                if (passwordExpiresAt && passwordExpiresAt < new Date())
                    securityScore -= 30;
                securityScore = Math.max(0, securityScore);
                res.json({
                    loginAttempts24h: loginCount + failedCount,
                    failedAttempts24h: failedCount,
                    lastLogin: (lastLogin === null || lastLogin === void 0 ? void 0 : lastLogin.created_at) || null,
                    securityScore,
                    twoFactorEnabled: false,
                    emailVerified: !!user.otpVerified,
                    passwordExpiresAt: (passwordExpiresAt === null || passwordExpiresAt === void 0 ? void 0 : passwordExpiresAt.toISOString()) || null,
                    daysUntilPasswordExpiry: daysUntilExpiry,
                    lastSecurityCheck: new Date().toISOString(),
                });
            }
            catch (error) {
                console.error("getSecurityOverview error:", error);
                res.status(500).json({ message: "Error fetching security overview." });
            }
        });
    }
    getLoginAnalytics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const totalLogins = yield activity_model_1.Activity.countDocuments({ userId: userId.toString(), action: "LOGIN" });
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const loginsThisWeek = yield activity_model_1.Activity.countDocuments({
                    userId: userId.toString(),
                    action: "LOGIN",
                    created_at: { $gte: oneWeekAgo },
                });
                const totalAttempts = yield activity_model_1.Activity.countDocuments({
                    userId: userId.toString(),
                    action: { $in: ["LOGIN", "LOGIN_FAILED"] },
                });
                const successRate = totalAttempts > 0 ? Math.round((totalLogins / totalAttempts) * 1000) / 10 : 100;
                const firstActivity = yield activity_model_1.Activity.findOne({ userId: userId.toString() }).sort({ created_at: 1 }).select("created_at");
                const daysSinceFirst = (firstActivity === null || firstActivity === void 0 ? void 0 : firstActivity.created_at)
                    ? Math.max(1, Math.ceil((Date.now() - new Date(firstActivity.created_at).getTime()) / (24 * 60 * 60 * 1000)))
                    : 1;
                const avgPerDay = Math.round((totalLogins / daysSinceFirst) * 10) / 10;
                const months = [];
                for (let i = 11; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const start = new Date(d.getFullYear(), d.getMonth(), 1);
                    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
                    const count = yield activity_model_1.Activity.countDocuments({
                        userId: userId.toString(),
                        action: "LOGIN",
                        created_at: { $gte: start, $lte: end },
                    });
                    months.push({ month: start.toLocaleString("default", { month: "short" }), count });
                }
                res.json({
                    totalLogins,
                    thisWeek: loginsThisWeek,
                    avgPerDay,
                    successRate,
                    chartData: months,
                });
            }
            catch (error) {
                console.error("getLoginAnalytics error:", error);
                res.status(500).json({ message: "Error fetching login analytics." });
            }
        });
    }
    getSecurityLogs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const securityActions = ["LOGIN", "PASSWORD_SET", "PASSWORD_RESET", "PASSWORD_RESET_REQUEST", "OTP_VERIFIED", "REGISTER"];
                const events = yield activity_model_1.Activity.find({
                    userId: userId.toString(),
                    action: { $in: securityActions },
                }).sort({ created_at: -1 }).limit(50).lean();
                const total = events.length;
                const loginEvents = events.filter((e) => e.action === "LOGIN").length;
                const passwordChanges = events.filter((e) => e.action === "PASSWORD_SET" || e.action === "PASSWORD_RESET").length;
                const list = events.map((e) => {
                    var _a;
                    return ({
                        title: e.action === "PASSWORD_SET" ? "Password Set" : e.action === "OTP_VERIFIED" ? "Account Verified" : e.action === "REGISTER" ? "Account Created" : e.action.replace(/_/g, " "),
                        description: e.description,
                        ip: e.ipAddress || "System",
                        source: ((_a = e.metadata) === null || _a === void 0 ? void 0 : _a.source) || "Security System",
                        createdAt: e.created_at,
                    });
                });
                res.json({
                    summary: {
                        totalEvents: total,
                        loginEvents,
                        securityAlerts: 0,
                        passwordChanges,
                    },
                    events: list,
                });
            }
            catch (error) {
                console.error("getSecurityLogs error:", error);
                res.status(500).json({ message: "Error fetching security logs." });
            }
        });
    }
    getActivityHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const page = Math.max(1, Number(req.query.page) || 1);
                const limit = Math.min(50, Math.max(10, Number(req.query.limit) || 20));
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const skip = (page - 1) * limit;
                const [activities, total] = yield Promise.all([
                    activity_model_1.Activity.find({ userId: userId.toString() }).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
                    activity_model_1.Activity.countDocuments({ userId: userId.toString() }),
                ]);
                const loginCount = activities.filter((a) => a.action === "LOGIN").length;
                const securityCount = activities.filter((a) => ["PASSWORD_SET", "PASSWORD_RESET", "OTP_VERIFIED", "REGISTER"].includes(a.action)).length;
                const passwordChangeCount = activities.filter((a) => a.action === "PASSWORD_SET" || a.action === "PASSWORD_RESET").length;
                const profileUpdateCount = 0;
                const list = activities.map((a) => {
                    var _a;
                    return ({
                        action: a.action,
                        title: a.action === "PASSWORD_SET" ? "Password Set" : a.action === "OTP_VERIFIED" ? "Account Verified" : a.action === "REGISTER" ? "Account Created" : a.action === "LOGIN" ? "Current Session" : a.action.replace(/_/g, " "),
                        description: a.description,
                        ip: a.ipAddress,
                        userAgent: (_a = a.metadata) === null || _a === void 0 ? void 0 : _a.userAgent,
                        createdAt: a.created_at,
                        status: a.action === "LOGIN" ? "ACTIVE" : "SUCCESS",
                    });
                });
                res.json({
                    summary: {
                        totalEvents: total,
                        logins: yield activity_model_1.Activity.countDocuments({ userId: userId.toString(), action: "LOGIN" }),
                        securityEvents: securityCount,
                        passwordChanges: passwordChangeCount,
                        profileUpdates: profileUpdateCount,
                    },
                    activities: list,
                    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
                });
            }
            catch (error) {
                console.error("getActivityHistory error:", error);
                res.status(500).json({ message: "Error fetching activity history." });
            }
        });
    }
    exportActivityCsv(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const activities = yield activity_model_1.Activity.find({ userId: userId.toString() }).sort({ created_at: -1 }).limit(500).lean();
                const header = "Action,Description,IP Address,Created At\n";
                const rows = activities.map((a) => `"${(a.action || "").replace(/"/g, '""')}","${(a.description || "").replace(/"/g, '""')}","${a.ipAddress || ""}","${a.created_at}"`).join("\n");
                const csv = header + rows;
                res.setHeader("Content-Type", "text/csv");
                res.setHeader("Content-Disposition", "attachment; filename=activity-history.csv");
                res.send(csv);
            }
            catch (error) {
                console.error("exportActivityCsv error:", error);
                res.status(500).json({ message: "Error exporting CSV." });
            }
        });
    }
    refreshToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const email = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
                const role = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
                const name = (_d = req.user) === null || _d === void 0 ? void 0 : _d.name;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const user = yield user_model_1.User.findById(userId);
                if (!user) {
                    res.status(401).json({ message: "User not found." });
                    return;
                }
                const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role, name: user.fullName }, JWT_SECRET, { expiresIn: "1h" });
                res.json({ token });
            }
            catch (error) {
                console.error("refreshToken error:", error);
                res.status(500).json({ message: "Error refreshing token." });
            }
        });
    }
    securityLockdown(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                yield session_model_1.Session.deleteMany({ userId: userId.toString() });
                res.json({ message: "All sessions terminated. Please log in again." });
            }
            catch (error) {
                console.error("securityLockdown error:", error);
                res.status(500).json({ message: "Error during security lockdown." });
            }
        });
    }
    getNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized." });
                    return;
                }
                const notifications = [];
                const user = yield user_model_1.User.findById(userId).select("passwordExpiresAt").lean();
                const activities = yield activity_model_1.Activity.find({ userId: userId.toString() })
                    .sort({ created_at: -1 })
                    .limit(20)
                    .lean();
                for (const a of activities) {
                    const created = a.created_at;
                    const createdAt = created ? new Date(created).toISOString() : new Date().toISOString();
                    if (a.action === "LOGIN") {
                        const meta = a.metadata || {};
                        const browser = meta.browser || "Unknown browser";
                        const os = meta.os || "Unknown OS";
                        notifications.push({
                            title: "Security Alert",
                            message: `New login detected from ${browser} on ${os}`,
                            createdAt,
                            type: "security",
                        });
                    }
                    else if (a.action === "PASSWORD_SET" || a.action === "PASSWORD_RESET") {
                        notifications.push({
                            title: "Account Updated",
                            message: "Password was changed successfully.",
                            createdAt,
                            type: "success",
                        });
                    }
                    else if (a.action === "OTP_VERIFIED" || a.action === "REGISTER") {
                        notifications.push({
                            title: "Account Updated",
                            message: a.action === "OTP_VERIFIED" ? "Email address verified successfully." : "Account was created and verified.",
                            createdAt,
                            type: "success",
                        });
                    }
                }
                if (user && user.passwordExpiresAt) {
                    const exp = new Date(user.passwordExpiresAt).getTime();
                    const now = Date.now();
                    const daysLeft = Math.ceil((exp - now) / (24 * 60 * 60 * 1000));
                    if (daysLeft > 0 && daysLeft <= 30) {
                        notifications.unshift({
                            title: "Password Expiry Warning",
                            message: `Your password will expire in ${daysLeft} days (30-day policy).`,
                            createdAt: new Date().toISOString(),
                            type: "warning",
                        });
                    }
                }
                notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const limited = notifications.slice(0, 15);
                res.json({ notifications: limited });
            }
            catch (error) {
                console.error("getNotifications error:", error);
                res.status(500).json({ message: "Error fetching notifications." });
            }
        });
    }
}
exports.default = new DashboardController();
