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
exports.logActivity = void 0;
const activity_model_1 = require("../database/models/activity.model");
const email_1 = __importDefault(require("./email"));
const ipLocation_1 = require("./ipLocation");
const ADMIN_EMAIL = "chaudharysujan5655@gmail.com";
const logActivity = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, userEmail, userName, action, description, ipAddress, metadata } = params;
        // Get location from IP using utility function
        const location = (0, ipLocation_1.getLocationFromIP)(ipAddress);
        // Save activity to database
        const activity = new activity_model_1.Activity({
            userId,
            userEmail,
            userName,
            action,
            description,
            ipAddress: ipAddress || null,
            location,
            metadata: metadata || {},
        });
        yield activity.save();
        // Send email notification to admin
        try {
            // Get action color and icon based on action type
            const getActionStyle = (actionType) => {
                const styles = {
                    LOGIN: { color: "#10b981", bgColor: "#d1fae5", icon: "🔐" },
                    REGISTER: { color: "#3b82f6", bgColor: "#dbeafe", icon: "👤" },
                    OTP_VERIFIED: { color: "#8b5cf6", bgColor: "#e9d5ff", icon: "✓" },
                    PASSWORD_RESET: { color: "#f59e0b", bgColor: "#fef3c7", icon: "🔑" },
                    PASSWORD_RESET_REQUEST: { color: "#ef4444", bgColor: "#fee2e2", icon: "⚠️" },
                };
                return styles[actionType] || { color: "#6b7280", bgColor: "#f3f4f6", icon: "📋" };
            };
            const actionStyle = getActionStyle(action);
            const timestamp = new Date().toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
            });
            const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Activity Notification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 650px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 35px 30px; text-align: center;">
                    <div style="display: inline-block; width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
                      ${actionStyle.icon}
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">User Activity Alert</h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Real-time Security Monitoring</p>
                  </td>
                </tr>
                
                <!-- Action Badge -->
                <tr>
                  <td style="padding: 25px 30px 0 30px;">
                    <div style="display: inline-block; background-color: ${actionStyle.bgColor}; color: ${actionStyle.color}; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${action}
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 25px 30px;">
                    <div style="background-color: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Activity Details</h3>
                      
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; width: 140px; vertical-align: top; font-weight: 500;">User Name:</td>
                          <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${userName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top; font-weight: 500;">Email:</td>
                          <td style="padding: 10px 0; color: #1f2937; font-size: 14px;">
                            <a href="mailto:${userEmail}" style="color: #3b82f6; text-decoration: none;">${userEmail}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top; font-weight: 500;">Description:</td>
                          <td style="padding: 10px 0; color: #1f2937; font-size: 14px; line-height: 1.6;">${description}</td>
                        </tr>
                        ${location && location !== "Unknown location" ? `
                        <tr>
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top; font-weight: 500;">Location:</td>
                          <td style="padding: 10px 0; color: #1f2937; font-size: 14px;">📍 ${location}</td>
                        </tr>
                        ` : ""}
                        ${ipAddress && ipAddress !== "" ? `
                        <tr>
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top; font-weight: 500;">IP Address:</td>
                          <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-family: 'Courier New', monospace;">${ipAddress}</td>
                        </tr>
                        ` : ""}
                        <tr>
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top; font-weight: 500;">Timestamp:</td>
                          <td style="padding: 10px 0; color: #1f2937; font-size: 14px;">🕐 ${timestamp}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Security Notice -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 20px;">
                      <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                        <strong>🔒 Security Note:</strong> This is an automated notification. All user activities are logged for security and audit purposes. If you notice any suspicious activity, please investigate immediately.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                      This is an automated email from CyberShield Security System
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} CyberShield Systems. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
            yield (0, email_1.default)({
                email: ADMIN_EMAIL,
                subject: `User Activity: ${action} - ${userName}`,
                html: htmlContent,
            });
        }
        catch (emailError) {
            console.error("Failed to send activity email notification:", emailError);
            // Don't throw - activity logging should not fail if email fails
        }
    }
    catch (error) {
        console.error("Error logging activity:", error);
        // Don't throw - activity logging should not break the main flow
    }
});
exports.logActivity = logActivity;
