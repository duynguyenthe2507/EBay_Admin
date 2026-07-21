const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { sendEmail } = require("../services/emailService");
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Hàm kiểm tra định dạng email
const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Hàm tạo mật khẩu ngẫu nhiên
const generatePassword = () => {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, fullname, email, password, role } = req.body;

    // Kiểm tra đầu vào
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email và password là bắt buộc" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Định dạng email không hợp lệ" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải dài ít nhất 6 ký tự" });
    }
    // Allow buyer/seller for self-registration; admin roles only via admin endpoints
    if (role && !["buyer", "seller"].includes(role)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ. Chỉ có thể đăng ký với vai trò buyer hoặc seller" });
    }

    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username hoặc email đã tồn tại" });
    }

    // Tạo người dùng mới
    const user = new User({
      username,
      fullname,
      email,
      password, // Sẽ được mã hóa bởi hook pre-save
      role: role || "buyer",
      accountStatus: "approved",
    });

    await user.save();

    // Gửi email chào mừng
    try {
      await sendEmail(user.email, "Welcome to Shopii", "Thank you for registering with us!");
    } catch (emailError) {
      logger.error("Failed to send welcome email:", emailError);
    }

    res.status(201).json({ success: true, message: "Đăng ký thành công" });
  } catch (error) {
    logger.error("Lỗi đăng ký:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email và password là bắt buộc" });
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Thông tin đăng nhập không hợp lệ" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Thông tin đăng nhập không hợp lệ" });
    }

    // Admin IP/2FA policy
    const { isInternalIp } = require('../utils/ip');
    const internal = isInternalIp(req);

    // If admin and not internal and 2FA enabled -> return temp token and requires2FA
    if (user.role === 'admin' && !internal) {
      // If a trusted-device cookie exists and is valid, bypass 2FA
      const deviceCookie = req.cookies && req.cookies.admin_trusted_device;
      if (deviceCookie && user.trustedDevices && user.trustedDevices.length) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(deviceCookie).digest('hex');
        const now = new Date();
        const match = user.trustedDevices.find(d => d.tokenHash === hash && d.expiresAt > now);
        if (match) {
          const token = jwt.sign(
            { id: user._id, role: user.role, twoFAVerified: true },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
          );
          return res.json({ success: true, token, user: { id: user._id, username: user.username, role: user.role } });
        }
      }

      if (!user.twoFAEnabled) {
        // Force setup before allowing admin access from outside
        const tempSetupToken = jwt.sign(
          { id: user._id, role: user.role, twoFASetup: true },
          process.env.JWT_SECRET,
          { expiresIn: '10m' }
        );
        return res.json({ success: true, requires2FASetup: true, token: tempSetupToken });
      } else {
        const tempToken = jwt.sign(
          { id: user._id, role: user.role, twoFARequired: true },
          process.env.JWT_SECRET,
          { expiresIn: '10m' }
        );
        return res.json({
          success: true,
          requires2FA: true,
          token: tempToken
        });
      }
    }

    // Check if account is locked
    if (user.action === 'lock') {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa",
        accountStatus: 'locked',
        lockReason: user.lockReason || 'Tài khoản đã bị khóa bởi quản trị viên',
        lockDuration: user.lockDuration || 'Không xác định',
        lockUntil: user.lockUntil || null
      });
    }

    // Check if account is rejected
    if (user.accountStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị từ chối",
        accountStatus: 'rejected',
        rejectionReason: user.rejectionReason || null
      });
    }

    // Check if account is pending approval
    // Otherwise issue full token (include twoFAVerified if internal)
    const token = jwt.sign(
      { id: user._id, role: user.role, twoFAVerified: internal },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      accessToken: token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        action: user.action,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    logger.error("Lỗi đăng nhập:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email là bắt buộc" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const newPassword = generatePassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu mà không kích hoạt hook pre-save
    await User.updateOne({ _id: user._id }, { password: hashedPassword });

    // Gửi email với mật khẩu mới
    await sendEmail(user.email, "Mật khẩu mới của bạn", `Mật khẩu mới của bạn là: ${newPassword}`);

    res.json({ success: true, message: "Mật khẩu mới đã được gửi tới email của bạn" });
  } catch (error) {
    logger.error("Lỗi trong forgotPassword:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Thay đổi vai trò người dùng
const { ROLES: APP_ROLES, ADMIN_ROLES } = require('../middleware/rbac');

// Change role: If user is admin-level, they can change to any defined role (for other users via admin endpoints).
// If a regular user calls this endpoint to change their own role, allow only switching between buyer/seller.
exports.changeRole = async (req, res) => {
  try {
    const { role, userId: targetUserId } = req.body;
    const callerId = req.user.id; // caller ID from auth middleware
    const callerRole = req.user.role;

    // Basic validation
    if (!role) {
      return res.status(400).json({ success: false, message: 'Vai trò mới là bắt buộc' });
    }

    // Determine target user (if admin changes someone else)
    const effectiveUserId = targetUserId || callerId;

    // If caller is admin-level, allow any role defined in APP_ROLES
    if (ADMIN_ROLES.includes(callerRole)) {
      if (!Object.values(APP_ROLES).includes(role)) {
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
      }
    } else {
      // Non-admins can only switch between buyer and seller for themselves
      if (effectiveUserId !== callerId) {
        return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền thay đổi vai trò người khác' });
      }
      if (![APP_ROLES.BUYER, APP_ROLES.SELLER].includes(role)) {
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ. Chỉ được đổi giữa buyer/seller' });
      }
    }

    // Find and update user
    const user = await User.findById(effectiveUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.role = role;
    await user.save();

    // If the caller changed their own role, issue a fresh token
    let token = null;
    if (effectiveUserId.toString() === callerId.toString()) {
      token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    }

    res.json({
      success: true,
      message: `Vai trò đã được cập nhật thành ${role}`,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Lỗi thay đổi vai trò:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware

    const user = await User.findById(userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error("Error getting user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- Admin 2FA setup (TOTP) ---
exports.setupAdmin2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can setup 2FA' });
    }
    const secret = speakeasy.generateSecret({ name: `Shopii Admin (${user.email})` });
    user.twoFASecret = secret.base32;
    user.twoFAEnabled = true;
    await user.save();

    const otpauth = secret.otpauth_url;
    const qr = await qrcode.toDataURL(otpauth);
    return res.json({ success: true, otpauth, qr });
  } catch (err) {
    logger.error('setupAdmin2FA error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- Verify admin 2FA and issue full token ---
exports.verifyAdmin2FA = async (req, res) => {
  try {
    const { token, trustDevice } = req.body; // 6-digit code and optional trust flag
    const authHeader = req.headers.authorization || '';
    const temp = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!temp) {
      return res.status(400).json({ success: false, message: 'Missing temporary token' });
    }
    const decoded = jwt.verify(temp, process.env.JWT_SECRET);
    if (!decoded.twoFARequired) {
      return res.status(400).json({ success: false, message: 'Token is not a 2FA token' });
    }
    const user = await User.findById(decoded.id);
    if (!user || !user.twoFAEnabled || !user.twoFASecret) {
      return res.status(400).json({ success: false, message: '2FA not set up' });
    }
    const ok = speakeasy.totp.verify({ secret: user.twoFASecret, encoding: 'base32', token });
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
    }
    const fullToken = jwt.sign(
      { id: user._id, role: user.role, twoFAVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    // If trusting this device, set a cookie and store token hash
    if (trustDevice) {
      const crypto = require('crypto');
      const raw = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      const ttlDays = parseInt(process.env.ADMIN_TRUSTED_DEVICE_TTL_DAYS || '30', 10);
      const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

      user.trustedDevices = (user.trustedDevices || []).filter(d => d.expiresAt > new Date());
      user.trustedDevices.push({ tokenHash: hash, userAgent: req.headers['user-agent'], expiresAt });
      await user.save();

      res.cookie('admin_trusted_device', raw, {
        httpOnly: true,
        secure: !!(process.env.NODE_ENV === 'production'),
        sameSite: 'lax',
        maxAge: ttlDays * 24 * 60 * 60 * 1000
      });
    }
    return res.json({ success: true, token: fullToken });
  } catch (err) {
    logger.error('verifyAdmin2FA error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware
    const { fullname, email, avatarURL } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate email if provided
    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      // Check if email is already in use
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      user.email = email;
    }

    // Update fields if provided
    if (fullname) user.fullname = fullname;
    if (avatarURL) user.avatarURL = avatarURL;

    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    logger.error("Error updating user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by the pre-save hook
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    logger.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};