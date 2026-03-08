import express, { Router } from "express";
import authController,{ captchaController } from "../../../controller/auth.controller";
const router: Router = express.Router();


router.route("/register").post(authController.registerUser)
router.route("/login").post(authController.loginUser);
router.route("/captcha").get(captchaController.captcha)
router.route("/verify-captcha").post(captchaController.verifyCaptcha)
router.route("/verify-otp").post(authController.verifyOTP)
router.route("/resend-otp").post(authController.resendOTP)
router.route("/otp-remaining-time").post(authController.getOtpRemainingTime)

router.route("/forgotpassword").post(authController.forgotPassword)
router.route("/resetpassword").post(authController.resetPassword)
export default router;
