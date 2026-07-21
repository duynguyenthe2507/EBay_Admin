// Basic IPv4 CIDR checker and internal IP detector for access policies

function parseAllowlist() {
    const allowlist = (process.env.ADMIN_IP_ALLOWLIST || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    return allowlist;
}

function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + (parseInt(octet, 10) || 0), 0) >>> 0;
}

function inCidr(ip, cidr) {
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr || '32', 10);
    if (!range || Number.isNaN(bits)) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}

function isRfc1918(ip) {
    return (
        inCidr(ip, '10.0.0.0/8') ||
        inCidr(ip, '172.16.0.0/12') ||
        inCidr(ip, '192.168.0.0/16') ||
        ip === '127.0.0.1' || ip === '::1'
    );
}

function getClientIp(req) {
    const xfwd = req.headers['x-forwarded-for'];
    if (typeof xfwd === 'string' && xfwd.length > 0) {
        return xfwd.split(',')[0].trim();
    }
    // Express formats IPv6 localhost as ::ffff:127.0.0.1 sometimes
    const raw = (req.ip || '').replace('::ffff:', '');
    return raw || req.connection?.remoteAddress || '0.0.0.0';
}

function isInternalIp(req) {
    const ip = getClientIp(req);
    const allowlist = parseAllowlist();
    if (isRfc1918(ip)) return true;
    for (const entry of allowlist) {
        if (inCidr(ip, entry)) return true;
    }
    return false;
}

module.exports = { isInternalIp, getClientIp };


