const express = require("express");
const router = express.Router();
const axios = require("axios");
const querystring = require("querystring");
const {
  getInstagramBusinessAccounts,
} = require("../../../../utils/Instagram/users");
const { addInstagramAccount } = require("../../services/socialLogin.service");
const { jwtAuth } = require("../../../../middlewares/auth/jwtAuth");
const clientId = process.env.FACEBOOK_APP_ID;
const clientSecret = process.env.FACEBOOK_APP_SECRET;
const callbackUrl = "/api/instagram/callback";
// https://localhost:8080/api/instagram/callback/:id
const auth = require("../../../../middlewares/auth/index");
const { User } = require("../../../../db/schemas/onboarding/user.schema");

const { getBaseUrl } = require("../../../../utils/onboarding/index");
const TemSocialAccounts = require("../../../../db/schemas/onboarding/tem.socialAccounts");
const { mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

let mainUser;

router.get("/instagram", auth(), async (req, res) => {
  try {

    mainUser = await User.findOne({ _id: req.locals.id });
    mainUser.brandId = req.query.brand_id;
    if (req.hostname === "localhost") {
      mainUser["user_url"] =
        (await req.header("Referer")) + req?.query?.path?.substring(1);
    } else {
      mainUser["user_url"] = await req.header("Referer") + req?.query?.path?.substring(1)
    }
    // mainUser.user_url=JSON.stringify(mainUser.user_url)
    // console.log("mainUser",mainUser.user_url)
    // const insertSocialData =  new TemSocialAccounts({
    //   data:  [mainUser]
    // })

    // const socialData = await insertSocialData.save();

    const permissions = [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_comments",
      "instagram_manage_insights",
      "instagram_shopping_tag_products",
      "pages_show_list",
      "pages_manage_engagement",
      "pages_manage_metadata",
      "pages_read_engagement",
      "pages_read_user_content",
      // "instagram_graph_user_media", // need advance level access
      // "instagram_graph_user_profile", // need advance level access
    ].join(",");

    const authorizationUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${clientId}&redirect_uri=${getBaseUrl(
      req
    )}${callbackUrl}&scope=${permissions}&auth_type=reauthenticate`;

    console.log('test ', authorizationUrl)
    res.redirect(authorizationUrl);
  } catch (err) {
    res.status(500).send({
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: 400,
    });
  }
});

router.get("/instagram/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const id = req.query.id;
    // const mainUser = await TemSocialAccounts.findOne({
    //   _id : new ObjectId(id)
    // }).lean()

    const tokenExchangeUrl = `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${clientId}&redirect_uri=${getBaseUrl(
      req
    )}${callbackUrl}&client_secret=${clientSecret}&code=${code}&auth_type=reauthenticate`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;

    const extendAccessTokenUrl = `https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}&auth_type=reauthenticate`;
    const newResponse = await axios.get(extendAccessTokenUrl);
    const extendedAccessToken = newResponse.data.access_token;

    // const brandId = mainUser.brandId || "abc";

    const pagesInfo = await getInstagramBusinessAccounts(extendedAccessToken);

    const insertSocialData =  new TemSocialAccounts({
     
      data:  {
        account_type:"instagram",
        pagesInfo
      },
    })

    const socialData = await insertSocialData.save();

    res.redirect(`${mainUser.user_url}?socialAccounts=${socialData._id}`);

    // await addInstagramAccount(req, res);
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
