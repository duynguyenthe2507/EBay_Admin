export const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
  MONITOR: 'monitor',
  SUPPORT: 'support',
  FINANCE: 'finance',
};

export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view:dashboard',
  MANAGE_PRODUCTS: 'manage:products',
  MANAGE_USERS: 'manage:users',
  MANAGE_ORDERS: 'manage:orders',
  MANAGE_VOUCHERS: 'manage:vouchers',
  VIEW_REPORTS: 'view:reports',
  MANAGE_PAYMENTS: 'manage:payments',
  MANAGE_DISPUTES: 'manage:disputes',
};

export const ROLE_PERMISSIONS = {
  [ROLES.BUYER]: [],
  [ROLES.SELLER]: [PERMISSIONS.MANAGE_PRODUCTS, PERMISSIONS.MANAGE_ORDERS, PERMISSIONS.VIEW_REPORTS],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MONITOR]: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_REPORTS],
  [ROLES.SUPPORT]: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_DISPUTES, PERMISSIONS.VIEW_DASHBOARD],
  [ROLES.FINANCE]: [PERMISSIONS.MANAGE_PAYMENTS, PERMISSIONS.VIEW_REPORTS],
};

export const hasPermission = (role, permission) => {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[role] || [];
  if (role === ROLES.ADMIN) return true;
  return allowed.includes(permission);
};
