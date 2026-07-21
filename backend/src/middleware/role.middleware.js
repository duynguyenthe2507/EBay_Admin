const { ROLES, ADMIN_ROLES } = require('./rbac');

// Middleware to check seller role
exports.isSeller = (req, res, next) => {
  if (req.user && req.user.role === ROLES.SELLER) {
    return next(); // User is a seller, proceed
  }
  return res.status(403).json({ success: false, message: 'Access denied. Seller role required.' });
};

// Middleware to check admin-level roles (including monitor/support/finance)
exports.isAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role && ADMIN_ROLES.includes(role)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
};

