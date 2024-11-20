const JWT = require("jsonwebtoken");

module.exports = () => (req, res, next) => {
  console.log('test the user', req.query);  
  JWT.verify(req.headers.token, process.env.BCRYPT_TOKEN, (err, user) => {
    if (!user) {
      res.status(403).json("Invalid Token");
      return ;
    }
    req.user = user
    next();
  });
};
