const express = require("express");
const axios = require("axios");
const { jwtAuth } = require("../../../../middlewares/auth/jwtAuth");
const router = express.Router();
const querystring = require("querystring");
const SocialService = require("../../services/socialLogin.service");

const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const callbackUrl = "http://localhost:8080/api/linkedin/callback";

router.get("/linkedin", jwtAuth, async (req, res) => {
  try {
    const scope = [
      "r_liteprofile",
      "r_emailaddress",
      "w_member_social",
      "r_ads_reporting",
      "r_organization_social",
      "rw_organization_admin",
      "w_member_social",
      "r_emailaddress",
      "r_ads",
      "w_organization_social",
      "rw_ads",
      "r_basicprofile",
      "r_organization_admin",
      "r_1st_connections_size",
      // "rw_organization_analytics",
      // "rw_organization_social",
    ].join(",");
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${callbackUrl}&scope=${scope}`;

    res.redirect(url);
  } catch (error) {
    res.status(400).send({
      message: error.message,
      name: error.name,
      stack: error.stack,
      status: 400,
    });
  }
});

router.get("/linkedin/callback", async (req, res) => {
  try {
    const code = req.query.code;

    const { data } = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      querystring.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
        access_type: "offline",
        prompt: "consent",
      })
    );

    res.send(data);
    await SocialService.addLinkedinAccount(req, res);
  } catch (error) {
    res.status(400).send({
      message: error.message,
      name: error.name,
      stack: error.stack,
      status: 400,
    });
  }
});

module.exports = router;
