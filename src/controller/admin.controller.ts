import { Request, Response } from "express";
import { Activity } from "../database/models/activity.model";
import { User } from "../database/models/user.model";
import { Session } from "../database/models/session.model";
import jwt from "jsonwebtoken";

// Middleware to verify admin role
export const verifyAdmin = (req: Request, res: Response, next: any): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      res.status(401).json({ message: "No token provided." });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as any;
    
    if (decoded.role !== "admin") {
      res.status(403).json({ message: "Access denied. Admin role required." });
      return;
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

class AdminController {
  // Get all activities
  async getActivities(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 50, userId, action } = req.query;
      
      const query: any = {};
      if (userId) query.userId = userId;
      if (action) query.action = action;

      const skip = (Number(page) - 1) * Number(limit);

      const activities = await Activity.find(query)
        .sort({ created_at: -1 })
        .limit(Number(limit))
        .skip(skip);

      const total = await Activity.countDocuments(query);

      res.json({
        activities,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Error fetching activities." });
    }
  }

  // Get activity statistics
  async getActivityStats(req: Request, res: Response): Promise<void> {
    try {
      const totalActivities = await Activity.countDocuments();
      const totalUsers = await User.countDocuments({ role: "user" });
      
      // Get activities by action type
      const activitiesByAction = await Activity.aggregate([
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
      const recentActivities = await Activity.countDocuments({
        created_at: { $gte: last24Hours },
      });

      // Get activities by user
      const topUsers = await Activity.aggregate([
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
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      res.status(500).json({ message: "Error fetching activity statistics." });
    }
  }

  // Get all users (both user and admin roles for management)
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find({})
        .select("-password -otp -resetPasswordToken -passwordHistory")
        .sort({ created_at: -1 });

      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users." });
    }
  }

  // Get all sessions (all users' devices) - admin only
  async getAllSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await Session.find({}).sort({ lastActive: -1 }).lean();
      const userIds = [...new Set(sessions.map((s: any) => s.userId))];
      const users = await User.find({ _id: { $in: userIds } })
        .select("fullName email role")
        .lean();
      const userMap: Record<string, { fullName: string; email: string; role: string }> = {};
      users.forEach((u: any) => {
        userMap[u._id.toString()] = { fullName: u.fullName, email: u.email, role: u.role };
      });
      const list = sessions.map((s: any) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        userName: userMap[s.userId]?.fullName ?? "Unknown",
        userEmail: userMap[s.userId]?.email ?? "",
        userRole: userMap[s.userId]?.role ?? "user",
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ip: s.ip,
        location: s.location,
        lastActive: s.lastActive,
        firstSeen: s.created_at,
      }));
      res.json({
        total: list.length,
        sessions: list,
      });
    } catch (error) {
      console.error("Error fetching all sessions:", error);
      res.status(500).json({ message: "Error fetching sessions." });
    }
  }

  // Update user role - admin only (cannot change own role)
  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.id;
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

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      ).select("-password -otp -resetPasswordToken -passwordHistory");

      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }

      res.json({ message: "User role updated successfully.", user });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Error updating user role." });
    }
  }
}

export default new AdminController();

