const axios = require("axios");
const moment = require("moment");
const querystring = require("querystring");
const SocialAccounts = require("../../db/schemas/onboarding/social.schema");
const { getYoutubeTokenValidity } = require("../../utils/Moment/moment");

async function refreshYoutubeToken(refreshToken, userId, youtubeId) {
  try {
    // make API call to google to refresh access token
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      querystring.stringify({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
      })
    );
    // update the access token in Social Accounts Database using youtubeId and user Id
    const newAccessToken = data.accessToken;
    await SocialAccounts.updateOne(
      { user_id: userId, "youtube.account_id": youtubeId },
      {
        $set: {
          access_token: newAccessToken,
          exprie_date_time: getYoutubeTokenValidity(),
        },
      }
    );
    // return the updated info
    return newAccessToken;
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.authYoutubeToken = async (req, res, next) => {
  try {
    const { _id } = req.mainuser;
    const { youtube_account_id } = req.body;
    const youtubeAccount = await SocialAccounts.findOne(
      { user_id: _id, "youtube.account_id": youtube_account_id },
      { youtube: 1 }
    );
    if (youtubeAccount?._id) {
      if (moment(youtubeAccount.exprie_date_time).isBefore(moment().toDate())) {
        req.youtubeAccount = youtubeAccount;
        return next();
      } else {
        const info = await refreshYoutubeToken(
          youtubeAccount.refresh_token,
          _id,
          youtube_account_id
        );
        youtubeAccount.access_token = info;
        req.youtubeAccount = youtubeAccount;
        return next();
      }
    }
    // if youtube account doesnot exist, then redirect the user to authentication route
    res.redirect("http://localhost:8080/auth/google/youtube");
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
