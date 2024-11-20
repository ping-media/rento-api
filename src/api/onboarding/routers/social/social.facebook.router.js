const express = require("express");
const router = express.Router();
const socialLoginService = require("../../services/socialLogin.service");
const FB = require("facebook-node-sdk");
const axios = require("axios");
const path = require("path");
const auth = require("../../../../middlewares/auth/index");
const { getBaseUrl } = require("../../../../utils/onboarding/index");

const {
  getFacebookPagesInfo,
  getFacebookGroupsInfo,
} = require("../../../../utils/Facebook/user");
const { User } = require("../../../../db/schemas/onboarding/user.schema");
const TemSocialAccounts = require("../../../../db/schemas/onboarding/tem.socialAccounts");

const clientId = process.env.FACEBOOK_APP_ID;
const clientSecret = process.env.FACEBOOK_APP_SECRET;

const pageCallbackUrl = `/api/facebook/page/callback`;
const groupCallbackUrl = "/api/facebook/group/callback";

let mainUser;

router.get("/facebook/page", auth(), async (req, res) => {
  try {
    // main user
    mainUser = await User.findOne({ _id: req.locals.id });
    mainUser.brandId = req.query.brand_id;
    if (req.hostname === "localhost") {
      mainUser["user_url"] =
        (await req.header("Referer")) + req?.query?.path?.substring(1);
    } else {
      mainUser["user_url"] = await req.header("Referer") + req?.query?.path?.substring(1);
    }

    const permissions = [
      "pages_show_list",
      "pages_manage_posts",
      "page_events",
      "pages_manage_engagement",
      "pages_read_user_content",
      "pages_manage_ads",
      "pages_manage_metadata",
      "pages_read_engagement",
      "read_insights",
      "pages_messaging",
    ].join(",");

    const authorizationUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${clientId}&redirect_uri=${getBaseUrl(
      req
    )}${pageCallbackUrl}&scope=${permissions}&auth_type=reauthenticate`;

    res.redirect(authorizationUrl);
  } catch (err) {
    res.status(00).send({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
});

router.get("/facebook/page/callback?", async (req, res) => {
  try {
    const code = req.query.code;
    const tokenExchangeUrl = `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${clientId}&redirect_uri=${getBaseUrl(
      req
    )}${pageCallbackUrl}&client_secret=${clientSecret}&code=${code}&auth_type=reauthenticate`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;

    const extendAccessTokenUrl = `https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}&auth_type=reauthenticate`;
    const newResponse = await axios.get(extendAccessTokenUrl);
    const extendedAccessToken = newResponse.data.access_token;

    const pagesInfo = await getFacebookPagesInfo(extendedAccessToken);
  
    // req["pagesInfo"] = pagesInfo;
    // req['brandId'] = mainUser.brandId;
   
    const insertSocialData =  new TemSocialAccounts({
      data: {
        account_type:"facebookPage",
        pagesInfo
      },
    })

    const socialData = await insertSocialData.save();

    res.redirect(`${mainUser.user_url}?socialAccounts=${socialData._id}`);
    
  } catch (error) {
    res.status(500).send({
      message: error.message,
      name: error.name,
      stack: error.stack,
      status: 400,
    });
  }
});

router.get("/facebook/group", auth(), async (req, res) => {
  try {
    mainUser = await User.findOne({ _id: req.locals.id });
    mainUser.brandId = req.query.brand_id;
    console.log("host name", req.hostname);
    if (req.hostname === "localhost") {
      mainUser["userurl"] =
        (await req.header("Referer")) + req?.query?.path?.substring(1);
    } else {
      mainUser["userurl"] = await req.header("Referer") + req?.query?.path?.substring(1);
    }
    const permissions =  ["groups_access_member_info", "publish_to_groups"].join(
      ","
    );

    const authorizationUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${clientId}&redirect_uri=${getBaseUrl(
      req
    )}${groupCallbackUrl}&scope=${permissions}&auth_type=reauthenticate`;

    res. redirect(authorizationUrl);
  } catch (error) {
    res.status(500).send({
      message: error.message,
      name: error.name,
      stack: error.stack,
      status: 400,
    });
  }
});

router.get("/facebook/group/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const tokenExchangeUrl = `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${clientId}&redirect_uri=${getBaseUrl(
      req
    )}${groupCallbackUrl}&client_secret=${clientSecret}&code=${code}&auth_type=reauthenticate`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;
    const extendAccessTokenUrl = `https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}&auth_type=reauthenticate`;
    const newResponse = await axios.get(extendAccessTokenUrl);
    const extendedAccessToken = newResponse.data.access_token;

    req["mainUser"] = mainUser;

    // let groupsInfo = {};
    // groupsInfo["accessToken"] = extendedAccessToken;
    // groupsInfo["groupsList"] =
    // groupsInfo["brandId"] = mainUser.brandId || "abc";
    const pagesInfo = await getFacebookGroupsInfo(extendedAccessToken);

    const insertSocialData =  new TemSocialAccounts({
      data: {
        account_type:"facebookGroup",
        pagesInfo
      },
    })

    const socialData = await insertSocialData.save();

    res.redirect(`${mainUser.userurl}?socialAccounts=${socialData._id}`);

    // await socialLoginService.addFacebookGroups(req, res);
  } catch (err) {
    res.status(500).send({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
});

module.exports = router;
