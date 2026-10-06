const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const tokenHeader = req.header('Authorization');

  if (!tokenHeader) {
    return res.status(401).json({ message: 'No authorization token provided, authorization denied' });
  }

  const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.slice(7) : tokenHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'field_medic_super_secret_jwt_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

// Optional auth middleware (attaches req.user if token present, but doesn't block if anonymous)
const optionalAuth = (req, res, next) => {
  const tokenHeader = req.header('Authorization');
  if (tokenHeader) {
    const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.slice(7) : tokenHeader;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'field_medic_super_secret_jwt_key_2026');
      req.user = decoded;
    } catch (err) {
      // Ignore token errors for optional auth
    }
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
