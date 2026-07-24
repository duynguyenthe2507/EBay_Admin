const AuditLog = require("../models/AuditLog");

<<<<<<< HEAD
exports.generateChanges = (oldData = {}, newData = {}) => {
  const changedFields = [];
  
  // Extract keys to compare (avoid Mongoose internal fields if any, but assume plain objects passed)
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  
  allKeys.forEach(key => {
    // Skip mongoose fields or irrelevant fields
    if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt') return;
    
    let oldVal = oldData[key];
    let newVal = newData[key];
    
    // For objectids, stringify them to compare properly
    if (oldVal && oldVal.toString) oldVal = oldVal.toString();
    if (newVal && newVal.toString) newVal = newVal.toString();
    
    // Primitive comparison
    if (oldVal !== newVal) {
      changedFields.push({
        field: key,
        oldValue: oldData[key] !== undefined ? oldData[key] : null,
        newValue: newData[key] !== undefined ? newData[key] : null
      });
    }
  });
  
  return changedFields;
};

exports.createAuditLog = async ({
  admin,
  action,
  targetType,
  targetId,
  description,
  before,
  after,
  status = "SUCCESS",
  ip,
  userAgent,
}) => {
  try {
    return await AuditLog.create({
      admin,
      action,
      targetType,
      targetId,
      description,
      before,
      after,
      status,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
=======
function parseUserAgent(uaString = "") {
  if (!uaString) {
    return { browser: "Unknown", operatingSystem: "Unknown", device: "Desktop" };
  }

  let browser = "Unknown";
  let operatingSystem = "Unknown";
  let device = "Desktop";

  // Operating System
  if (/windows/i.test(uaString)) operatingSystem = "Windows";
  else if (/macintosh|mac os x/i.test(uaString)) operatingSystem = "macOS";
  else if (/linux/i.test(uaString)) operatingSystem = "Linux";
  else if (/android/i.test(uaString)) operatingSystem = "Android";
  else if (/iphone|ipad|ipod/i.test(uaString)) operatingSystem = "iOS";

  // Device
  if (/mobile/i.test(uaString)) device = "Mobile";
  else if (/tablet|ipad/i.test(uaString)) device = "Tablet";
  else device = "Desktop";

  // Browser
  if (/edg/i.test(uaString)) browser = "Edge";
  else if (/chrome|crios/i.test(uaString)) browser = "Chrome";
  else if (/firefox|fxios/i.test(uaString)) browser = "Firefox";
  else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) browser = "Safari";
  else if (/opera|opr/i.test(uaString)) browser = "Opera";

  return { browser, operatingSystem, device };
}

function getIpAddress(req) {
  if (!req) return "";
  const forwarded = req.headers ? req.headers["x-forwarded-for"] : null;
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "";
}

exports.createAuditLog = async (data = {}, req = null) => {
  try {
    let adminObjId = data.admin || data.adminId;
    let adminEmail = data.adminEmail;
    let adminName = data.adminName;
    let userAgentStr = data.userAgent;
    let ipAddr = data.ipAddress || data.ip;
    let endpoint = data.endpoint;
    let httpMethod = data.httpMethod;

    if (req) {
      if (!adminObjId && req.user) {
        adminObjId = req.user.id || req.user._id;
      }
      if (!adminEmail && req.user?.email) {
        adminEmail = req.user.email;
      }
      if (!adminName && req.user) {
        adminName = req.user.username || req.user.fullname || req.user.email || "";
      }
      if (!userAgentStr && req.headers) {
        userAgentStr = req.headers["user-agent"] || "";
      }
      if (!ipAddr) {
        ipAddr = getIpAddress(req);
      }
      if (!endpoint) {
        endpoint = req.originalUrl || req.url || "";
      }
      if (!httpMethod) {
        httpMethod = req.method || "";
      }
    }

    const { browser, operatingSystem, device } = parseUserAgent(userAgentStr);

    const logPayload = {
      admin: adminObjId || null,
      adminId: adminObjId || null,
      adminEmail: adminEmail || "",
      adminName: adminName || "",
      action: data.action || "UNKNOWN",
      targetType: data.targetType || "System",
      targetId: data.targetId ? String(data.targetId) : "",
      description: data.description || "",
      status: data.status ? data.status.toUpperCase() : "SUCCESS",
      ip: ipAddr || "127.0.0.1",
      ipAddress: ipAddr || "127.0.0.1",
      endpoint: endpoint || "",
      httpMethod: httpMethod || "",
      browser: data.browser || browser,
      operatingSystem: data.operatingSystem || operatingSystem,
      device: data.device || device,
      userAgent: userAgentStr || "",
      oldValue: data.oldValue !== undefined ? data.oldValue : null,
      newValue: data.newValue !== undefined ? data.newValue : null,
    };

    return await AuditLog.create(logPayload);
  } catch (error) {
    console.error("Error creating audit log:", error);
    return null;
>>>>>>> 8bb2696535bc5e1509d546669d330fd5897a6cc3
  }
};