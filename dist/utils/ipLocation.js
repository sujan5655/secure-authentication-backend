"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIPAndLocation = exports.getLocationFromIP = exports.getClientIP = void 0;
const geoip_lite_1 = __importDefault(require("geoip-lite"));
/**
 * Check if IP is localhost/local
 */
const isLocalhost = (ip) => {
    if (!ip || ip === "Unknown")
        return false;
    const localhostIPs = ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];
    return localhostIPs.includes(ip) || ip.startsWith("127.") || ip.startsWith("::1");
};
/**
 * Extract IP address from request
 */
const getClientIP = (req) => {
    var _a, _b;
    const forwarded = req.headers["x-forwarded-for"];
    const realIP = req.headers["x-real-ip"];
    const remoteAddress = ((_a = req.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) || ((_b = req.socket) === null || _b === void 0 ? void 0 : _b.remoteAddress);
    let ip = "Unknown";
    if (forwarded) {
        ip = forwarded.toString().split(",")[0].trim();
    }
    else if (realIP) {
        ip = realIP.toString();
    }
    else if (remoteAddress) {
        ip = remoteAddress.toString();
    }
    else if (req.ip) {
        ip = req.ip;
    }
    // Handle IPv6 mapped IPv4 addresses
    if (ip.startsWith("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    }
    return ip;
};
exports.getClientIP = getClientIP;
/**
 * Get location from IP address
 */
const getLocationFromIP = (ip) => {
    if (!ip || ip === "Unknown") {
        return "Unknown location";
    }
    // Handle localhost IPs
    if (isLocalhost(ip)) {
        return "Localhost (Development)";
    }
    try {
        const geo = geoip_lite_1.default.lookup(ip);
        if (geo) {
            const parts = [];
            if (geo.city)
                parts.push(geo.city);
            if (geo.region)
                parts.push(geo.region);
            if (geo.country)
                parts.push(geo.country);
            return parts.length > 0 ? parts.join(", ") : "Unknown location";
        }
    }
    catch (error) {
        console.error("Error looking up location:", error);
    }
    return "Unknown location";
};
exports.getLocationFromIP = getLocationFromIP;
/**
 * Get both IP and location from request
 */
const getIPAndLocation = (req) => {
    const ip = (0, exports.getClientIP)(req);
    const location = (0, exports.getLocationFromIP)(ip);
    return { ip, location };
};
exports.getIPAndLocation = getIPAndLocation;
