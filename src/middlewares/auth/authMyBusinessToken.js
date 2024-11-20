const axios = require("axios");

async function refreshMyBusinessToken(accessToken, refreshToken) {
  try {
    // make API call to google to refresh access token
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.authMyBusinessToken = async (req, res, next) => {
  try {
    const { _id } = req.mainuser;
    const {} = req.body;
    // get the token info from the database using user id
    // check the token validity, if token is not expired then use next() else refresh the token
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
