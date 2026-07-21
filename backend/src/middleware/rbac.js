// Central RBAC definitions and middleware
// Define roles and permission sets for the application

const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin', // full admin
  MONITOR: 'monitor', // read-only admin/observer
  SUPPORT: 'support', // customer support: manage users, disputes
  FINANCE: 'finance', // payments and refunds
};

// Define permissions. Keep these fine-grained and map them to roles below.
const PERMISSIONS = {
  VIEW_DASHBOARD: 'view:dashboard',
  MANAGE_PRODUCTS: 'manage:products',
  MANAGE_USERS: 'manage:users',
  MANAGE_ORDERS: 'manage:orders',
  MANAGE_VOUCHERS: 'manage:vouchers',
  VIEW_REPORTS: 'view:reports',
  MANAGE_PAYMENTS: 'manage:payments',
  MANAGE_DISPUTES: 'manage:disputes',
};

// Map roles to allowed permissions
const ROLE_PERMISSIONS = {
  [ROLES.BUYER]: [],
  [ROLES.SELLER]: [PERMISSIONS.MANAGE_PRODUCTS, PERMISSIONS.MANAGE_ORDERS, PERMISSIONS.VIEW_REPORTS],
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // full access
  [ROLES.MONITOR]: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_REPORTS],
  [ROLES.SUPPORT]: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_DISPUTES, PERMISSIONS.VIEW_DASHBOARD],
  [ROLES.FINANCE]: [PERMISSIONS.MANAGE_PAYMENTS, PERMISSIONS.VIEW_REPORTS],
};

// Helper to check if a role is an "admin-level" role
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.MONITOR, ROLES.SUPPORT, ROLES.FINANCE];

// Middleware factory to check permission
const authorize = (permission) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const allowed = ROLE_PERMISSIONS[role] || [];
    if (allowed.includes(permission) || ADMIN_ROLES.includes(role) && ROLE_PERMISSIONS[role]?.includes(permission)) {
      return next();
    }

    // If role is full admin, allow
    if (role === ROLES.ADMIN) return next();

    return res.status(403).json({ success: false, message: `Role (${role}) does not have permission: ${permission}` });
  };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ADMIN_ROLES,
  authorize,
};
