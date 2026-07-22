const AuditLog = require("../models/AuditLog");

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
  }
};