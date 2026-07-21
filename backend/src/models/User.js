const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    fullname: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      // Extended roles: keep legacy values and add specific admin roles
      enum: ["buyer", "seller", "admin", "monitor", "support", "finance"],
      default: "buyer",
    },
    avatarURL: { type: String },
    action: {
      type: String,
      enum: ["lock", "unlock"],
      default: "unlock",
    },
    accountStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
    lockReason: { type: String },
    lockDuration: { type: String },
    lockUntil: { type: Date },
    twoFAEnabled: { type: Boolean, default: false },
    twoFASecret: { type: String },
    trustedDevices: [
      {
        tokenHash: { type: String, required: true },
        userAgent: { type: String },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true }
      }
    ],
  },
  { timestamps: true }
);

// Mã hóa mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);