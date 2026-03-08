import express, { Router } from "express";
import adminController, { verifyAdmin } from "../../../controller/admin.controller";

const router: Router = express.Router();

// All admin routes require authentication
router.use(verifyAdmin);

router.route("/activities").get(adminController.getActivities);
router.route("/stats").get(adminController.getActivityStats);
router.route("/users").get(adminController.getUsers);
router.route("/sessions").get(adminController.getAllSessions);
router.put("/users/:userId/role", (req, res) => adminController.updateUserRole(req, res));

export default router;

