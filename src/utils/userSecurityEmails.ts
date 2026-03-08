import sendEmail from "./email";

const APP_NAME = process.env.APP_NAME || "Secure System";

export interface LoginAlertParams {
  userEmail: string;
  userName: string;
  securityLevel: "LOW" | "HIGH";
  time: string;
  ipAddress: string;
  location: string;
  device: string;
  sessionId: string;
  isNewDevice?: boolean;
}

export async function sendLoginAlertEmail(params: LoginAlertParams): Promise<void> {
  const { userEmail, userName, securityLevel, time, ipAddress, location, device, sessionId, isNewDevice } = params;
  const isHigh = securityLevel === "HIGH";

  const subject = isHigh
    ? `SECURITY ALERT: New Device Login - ${APP_NAME}`
    : `Login Alert - ${APP_NAME}`;

  const securityBoxBg = isHigh ? "#fee2e2" : "#d1fae5";
  const securityTextColor = isHigh ? "#b91c1c" : "#065f46";
  const securityLabel = isHigh ? "HIGH" : "LOW";
  const riskText = isHigh
    ? "High risk detected - immediate verification recommended."
    : "Low risk - Routine login notification";

  const newDeviceSection = isHigh
    ? `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">⚠️ NEW DEVICE SECURITY NOTICE</p>
      <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px;">This login was from a device we haven't seen before. If this wasn't you, please secure your account immediately.</p>
    </div>
    <div style="margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #b91c1c; font-size: 14px; font-weight: 700;">IMMEDIATE ACTION REQUIRED</p>
      <ul style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 13px; line-height: 1.8;">
        <li>Change your password immediately</li>
        <li>Enable two-factor authentication if not already active</li>
        <li>Review your account activity and recent sessions</li>
        <li>Check your device sessions and revoke unknown devices</li>
        <li>Contact our support team if you need assistance</li>
      </ul>
      <p style="margin: 10px 0 0 0; font-weight: 600; color: #1f2937;">Act quickly to protect your account security!</p>
    </div>
    <div style="background-color: #d1fae5; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #065f46; font-size: 13px; font-weight: 600;">Security Best Practices</p>
      <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 12px; line-height: 1.6;">
        <li>Always log out from shared or public computers</li>
        <li>Use strong, unique passwords for your account</li>
        <li>Enable two-factor authentication for enhanced security</li>
        <li>Regularly review your login activity and device sessions</li>
        <li>Keep your browser and operating system updated</li>
      </ul>
    </div>
  `
    : "";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background: #fff; border-collapse: collapse;">
    <tr>
      <td style="padding: 24px; border-bottom: 3px solid #3b82f6;">
        <h1 style="margin: 0; font-size: 22px; color: #1f2937;">🔔 Login Alert</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="margin: 0 0 16px 0; color: #4b5563;">Hello <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 20px 0; color: #4b5563;">We detected a ${isNewDevice ? "new device " : ""}login to your account with the following details:</p>
        
        <div style="background-color: ${securityBoxBg}; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: ${securityTextColor}; font-size: 14px; font-weight: 600;">🛡️ Security Level: ${securityLabel}</p>
          <p style="margin: 0; color: ${securityTextColor}; font-size: 13px;">${riskText}</p>
        </div>

        <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px; font-weight: 600;">📋 Login Summary</p>
          <table role="presentation" style="width: 100%; font-size: 13px;">
            <tr><td style="padding: 4px 0; color: #6b7280;">Time:</td><td style="padding: 4px 0; color: #1f2937;">${time}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">IP Address:</td><td style="padding: 4px 0; color: #1f2937;">${ipAddress}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Location:</td><td style="padding: 4px 0; color: #1f2937;">${location}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Device:</td><td style="padding: 4px 0; color: #1f2937;">${device}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Session ID:</td><td style="padding: 4px 0; color: #1f2937;">${sessionId}</td></tr>
          </table>
        </div>
        ${newDeviceSection}
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background: #f9fafb; font-size: 12px; color: #6b7280;">
        This is an automated security notification. Questions? Contact our security team for assistance.
        <br>© ${new Date().getFullYear()} ${APP_NAME}. Protecting your digital security.
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await sendEmail({ email: userEmail, subject, html: htmlContent });
  } catch (err) {
    console.error("Failed to send login alert email:", err);
  }
}

export interface AccountLockedParams {
  userEmail: string;
  userName: string;
  failedAttempts: number;
  ipAddress: string;
  timestamp: string;
}

export async function sendAccountLockedEmail(params: AccountLockedParams): Promise<void> {
  const { userEmail, userName, failedAttempts, ipAddress, timestamp } = params;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert - ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background: #fff; border-collapse: collapse;">
    <tr>
      <td style="padding: 24px;">
        <h1 style="margin: 0; font-size: 22px; color: #1f2937;">Security Alert - ${APP_NAME}</h1>
        <p style="margin: 16px 0 0 0; color: #4b5563;">Hello <strong>${userName}</strong>,</p>
        <p style="margin: 16px 0 0 0; color: #4b5563;">We detected a security event on your account.</p>
        <div style="background-color: #fee2e2; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #b91c1c; font-weight: 600;">Account locked</p>
          <p style="margin: 0; color: #991b1b; font-size: 14px;">${failedAttempts} failed login attempts from IP ${ipAddress}.</p>
          <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 13px;">Timestamp: ${timestamp}</p>
        </div>
        <p style="margin: 0; color: #4b5563;">Please review your account activity and ensure your account is secure. Use "Forgot Password" to reset your password and unlock your account.</p>
        <p style="margin: 24px 0 0 0; color: #6b7280;">Best regards,<br>${APP_NAME} Team</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await sendEmail({
      email: userEmail,
      subject: `Security Alert - ${APP_NAME}`,
      html: htmlContent,
    });
  } catch (err) {
    console.error("Failed to send account locked email:", err);
  }
}
