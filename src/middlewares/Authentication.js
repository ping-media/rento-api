const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtDecode=require("jwt-decode")

const Authentication = (req, res, next) => {
    const {token} = req.headers;
    if (!token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }
    try {
      
      const decoded = jwt.verify(token, process.env.BCRYPT_TOKEN);
      req.user = decoded;
     // consele.log(decoded)
      next();

    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
  };

  module.exports = Authentication;
  

