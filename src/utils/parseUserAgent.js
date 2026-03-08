"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserAgent = parseUserAgent;
/**
 * Parse User-Agent string to get browser, OS, and device type.
 */
function parseUserAgent(ua) {
    if (!ua || typeof ua !== "string") {
        return { browser: "Unknown", os: "Unknown", deviceType: "Desktop" };
    }
    let browser = "Unknown";
    if (ua.includes("Chrome") && !ua.includes("Edg"))
        browser = "Chrome";
    else if (ua.includes("Firefox"))
        browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
        browser = "Safari";
    else if (ua.includes("Edg"))
        browser = "Edge";
    else if (ua.includes("Opera") || ua.includes("OPR"))
        browser = "Opera";
    let os = "Unknown";
    if (ua.includes("Windows NT 10"))
        os = "Windows 10/11";
    else if (ua.includes("Windows"))
        os = "Windows";
    else if (ua.includes("Mac OS X") || ua.includes("Macintosh"))
        os = "macOS";
    else if (ua.includes("Android"))
        os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad"))
        os = "iOS";
    else if (ua.includes("Linux"))
        os = "Linux";
    let deviceType = "Desktop";
    if (ua.includes("Mobile") && !ua.includes("iPad"))
        deviceType = "Mobile";
    else if (ua.includes("iPad") || ua.includes("Tablet"))
        deviceType = "Tablet";
    return { browser, os, deviceType };
}
