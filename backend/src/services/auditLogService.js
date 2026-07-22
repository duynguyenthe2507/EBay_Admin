const AuditLog = require("../models/AuditLog");

console.log("AuditLog:", AuditLog);
console.log("typeof AuditLog:", typeof AuditLog);
console.log("typeof AuditLog.create:", typeof AuditLog.create);

exports.createAuditLog = async ({
  admin,
  action,
  targetType,
  targetId,
  description,
  ip,
  userAgent,
}) => {

  console.log({
    admin,
    action,
    targetType,
    targetId,
    description,
    ip,
    userAgent,
  });

  return await AuditLog.create({
    admin,
    action,
    targetType,
    targetId,
    description,
    ip,
    userAgent,
  });
};