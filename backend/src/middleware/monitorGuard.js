/**
 * monitorGuard.js
 * Middleware that blocks mutating HTTP methods (POST, PUT, PATCH, DELETE)
 * for users with the "monitor" role. Monitor is a read-only observer role.
 */
module.exports = function monitorGuard(req, res, next) {
  if (req.user?.role === 'monitor') {
    if (req.originalUrl && req.originalUrl.endsWith('/switch-role')) {
      return next();
    }
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(req.method)) {
      return res.status(403).json({
        success: false,
        message: 'Monitor role is read-only and cannot perform create, update, or delete actions.',
      });
    }
  }
  return next();
};
