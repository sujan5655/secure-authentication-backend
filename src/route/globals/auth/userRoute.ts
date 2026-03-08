import express, { Router } from "express";
import dashboardController from "../../../controller/dashboard.controller";
import { verifyUser } from "../../../middleware/auth.middleware";

const router: Router = express.Router();

router.use(verifyUser);

router.get("/profile", (req, res) => dashboardController.getProfile(req, res));
router.get("/sessions", (req, res) => dashboardController.getSessions(req, res));
router.post("/sessions/end-others", (req, res) => dashboardController.endOtherSessions(req, res));
router.get("/security-overview", (req, res) => dashboardController.getSecurityOverview(req, res));
router.get("/login-analytics", (req, res) => dashboardController.getLoginAnalytics(req, res));
router.get("/security-logs", (req, res) => dashboardController.getSecurityLogs(req, res));
router.get("/activity-history", (req, res) => dashboardController.getActivityHistory(req, res));
router.get("/activity-history/export", (req, res) => dashboardController.exportActivityCsv(req, res));
router.get("/notifications", (req, res) => dashboardController.getNotifications(req, res));
router.post("/refresh-token", (req, res) => dashboardController.refreshToken(req, res));
router.post("/security-lockdown", (req, res) => dashboardController.securityLockdown(req, res));

export default router;
