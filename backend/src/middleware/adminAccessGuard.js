const { isInternalIp, getClientIp } = require('../utils/ip');

// Require admin users from outside internal networks to have 2FA verified
module.exports = function adminAccessGuard(req, res, next) {
    try {
        const internal = isInternalIp(req);
        const twoFAVerified = Boolean(req.user && req.user.twoFAVerified);

        if (internal || twoFAVerified) {
            return next();
        }

        return res.status(401).json({
            success: false,
            message: 'Outside internal network. 2FA is required to access admin.',
            ip: getClientIp(req)
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Access guard error' });
    }
};


