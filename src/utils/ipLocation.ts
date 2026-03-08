import geoip from "geoip-lite";

/**
 * Check if IP is localhost/local
 */
const isLocalhost = (ip: string | undefined | null): boolean => {
  if (!ip || ip === "Unknown") return false;
  const localhostIPs = ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];
  return localhostIPs.includes(ip) || ip.startsWith("127.") || ip.startsWith("::1");
};

/**
 * Extract IP address from request
 */
export const getClientIP = (req: any): string => {
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
  
  let ip = "Unknown";
  
  if (forwarded) {
    ip = forwarded.toString().split(",")[0].trim();
  } else if (realIP) {
    ip = realIP.toString();
  } else if (remoteAddress) {
    ip = remoteAddress.toString();
  } else if (req.ip) {
    ip = req.ip;
  }
  
  // Handle IPv6 mapped IPv4 addresses
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  
  return ip;
};

/**
 * Get location from IP address
 */
export const getLocationFromIP = (ip: string | null | undefined): string => {
  if (!ip || ip === "Unknown") {
    return "Unknown location";
  }
  
  // Handle localhost IPs
  if (isLocalhost(ip)) {
    return "Localhost (Development)";
  }
  
  try {
    const geo = geoip.lookup(ip);
    if (geo) {
      const parts: string[] = [];
      if (geo.city) parts.push(geo.city);
      if (geo.region) parts.push(geo.region);
      if (geo.country) parts.push(geo.country);
      
      return parts.length > 0 ? parts.join(", ") : "Unknown location";
    }
  } catch (error) {
    console.error("Error looking up location:", error);
  }
  
  return "Unknown location";
};

/**
 * Get both IP and location from request
 */
export const getIPAndLocation = (req: any): { ip: string; location: string } => {
  const ip = getClientIP(req);
  const location = getLocationFromIP(ip);
  return { ip, location };
};

