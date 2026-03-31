const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const signAuthToken = (user) =>
  jwt.sign(
    {
      sub: user.username,
      isAdmin: Boolean(user.isAdmin),
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

const readBearerToken = (header = "") => {
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
};

const requireAuth = (req, res, next) => {
  const token = readBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.auth?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
};

module.exports = {
  signAuthToken,
  requireAuth,
  requireAdmin,
};
