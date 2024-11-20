const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const axios = require("axios");
const querystring = require("querystring");
const SocialService = require("../../services/socialLogin.service");
const { jwtAuth } = require("../../../../middlewares/auth/jwtAuth");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackUrl = "http://localhost:8080/api/youtube/callback";

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  callbackUrl
);

let mainuser;

router.get("/youtube", jwtAuth, async (req, res) => {
  try {
    mainuser = req.mainuser;

    const scopes = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtubepartner",
      "https://www.googleapis.com/auth/youtubepartner-channel-audit",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    res.redirect(url);
  } catch (error) {
    res.status(400).send({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
});

router.get("/youtube/callback", async (req, res) => {
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
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${data.access_token}`
    );

    const youtube = {};
    youtube["access_token"] = data?.access_token;
    youtube["expiry_date_time"] = "";
    youtube["refresh_token"] = data?.refresh_token;
    youtube["account_id"] = accountInfo?.data?.id;
    youtube["account_name"] = accountInfo?.data?.name;
    youtube["account_picture"] = accountInfo?.data?.picture;

    req["youtube"] = youtube;
    req["mainuser"] = mainuser;

    await SocialService.addYoutubeAccount(req, res);
  } catch (error) {
    res.status(400).send({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
});

module.exports = router;
