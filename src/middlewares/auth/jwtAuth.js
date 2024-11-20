const JWT = require("jsonwebtoken");
const axios = require("axios");
// const { getToken } = require("../../api/onboarding/models/login.model");
const { User } = require("../../db/schemas/onboarding/user.schema");

exports.jwtAuth = async (req, res, next) => {
  try {
    const data = await getToken(req.query.key);

    JWT.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) res.status(403).json("token is not valid");
      console.log("test user", user);
      req.locals = user
      next();
    });

    let mainuser = {};
      // const { jwt_token, workspace_id } = data;
      JWT.verify(req.query.key, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          res.status(403).json("token is not valid");
        }
        req.user = user;
        const userInfo = await User.findById();
        if (userInfo) {
          mainuser = userInfo._doc;
          mainuser.userurl = await req.header("Referer");
          mainuser._id = user.id;
          req.mainuser = mainuser;
          console.log("MU:::", await req.mainuser);
          return next();
        } else {
          mainuser = {
            _id: "63ec82209be7530efe9b58ce",
            user_type: "BUSINESS",
            email_id: "arokee@gmail.com",
            company_name: "Arokee",
            phone_number: "9100684109",
            otp_store: {
              email: "721649",
            },
            is_accepted_terms: true,
            onboarding_status: "WORKSPACE_REQ",
            first_name: "VAMSI",
            last_name: "KRISHNA",
          };
          mainuser.userurl = await req.header("Referer");
          req.mainuser = mainuser;
          return next();
        }
      });
  } catch (error) {
    res.status(403).send({
      success: false,
      error: error.message,
    });
  }
};
