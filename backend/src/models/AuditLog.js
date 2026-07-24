const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    adminEmail: {
      type: String,
    },

    adminName: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    ip: {
      type: String,
    },

    ipAddress: {
      type: String,
    },

    endpoint: {
      type: String,
    },

    httpMethod: {
      type: String,
    },

    browser: {
      type: String,
    },

    operatingSystem: {
      type: String,
    },

    device: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);