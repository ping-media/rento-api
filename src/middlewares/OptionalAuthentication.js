const jwt = require("jsonwebtoken");
require("dotenv").config();

const OptionalAuthentication = (req, res, next) => {
  const { token } = req.headers;

  req.user = null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.BCRYPT_TOKEN);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = OptionalAuthentication;
