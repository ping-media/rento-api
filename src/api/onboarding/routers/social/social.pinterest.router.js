const express = require("express");
const { jwtAuth } = require("../../../../middlewares/auth/jwtAuth");
const router = express.Router();
const querystring = require("querystring");
const axios = require("axios");
const { getPinterestAccountInfo } = require("../../../../utils/Pinterest/user");

const clientId = process.env.PINTEREST_APP_ID;
const clientSecret = process.env.PINTEREST_APP_SECRET;
const callbackUrl = "http://localhost:8080/api/pinterest/callback";

let mainuser;

router.get("/pinterest", jwtAuth, async (req, res) => {
  try {
    mainuser = req.mainuser;

    const scopes = [
      "ads:read",
      "boards:read",
      "boards:read_secret",
      "boards:write",
      "boards:write_secret",
      "pins:read",
      "pins:read_secret",
      "pins:write",
      "pins:write_secret",
      "user_accounts:read",
      "catalogs:read",
      "catalogs:write",
    ].join(",");

    const url = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${callbackUrl}&response_type=code&scope=${scopes}`;

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

router.get("/pinterest/callback", async (req, res) => {
  try {
    req.mainuser = mainuser;
    const code = req.query.code;
    const { data } = await axios.post(
      "https://api.pinterest.com/v5/oauth/token",
      querystring.stringify({
        code,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    const accountInfo = await getPinterestAccountInfo(data?.access_token);
    res.send({ data, accountInfo });
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
