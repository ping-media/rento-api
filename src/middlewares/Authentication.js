const jwt = require("jsonwebtoken");
require("dotenv").config();

// const Authentication = (req, res, next) => {
//   const authHeader = req.headers?.authorization;

//   if (!authHeader?.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.BCRYPT_TOKEN);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     if (err.name === "TokenExpiredError") {
//       return res.status(401).json({ message: "Token expired" });
//     }
//     return res.status(403).json({ message: "Invalid token" });
//   }
// };

const Authentication = (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token is required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.BCRYPT_TOKEN);
    req.user = decoded;
    // console.log(decoded);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = Authentication;
