const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const axios = require("axios");
const querystring = require("querystring");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackUrl = "http://localhost:8080/auth/google/mybusiness/callback";

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  callbackUrl
);

// google my business auth
router.get("/google/mybusiness", async (req, res) => {
  try {
    // generate a url that asks permissions for Blogger and Google Calendar scopes
    const scopes = [
      "https://www.googleapis.com/auth/plus.business.manage",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    res.redirect(url);
  } catch (error) {
    res.status(500).send({
      Success: false,
      message: error.message,
    });
  }
});

router.get("/google/mybusiness/callback", async (req, res) => {
  try {
    const code = req.query.code;

    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
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

    const accountInfo = await axios.get(
      // `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${data.access_token}`
      "https://mybusiness.googleapis.com/v4/accounts",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    );

    res.send({
      mybusiness: data,
      user: accountInfo.data.accounts,
    });
  } catch (error) {
    res.status(500).send({
      Success: false,
      message: error.message,
    });
  }
});

module.exports = router;
