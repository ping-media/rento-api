const axios = require("axios");
const baseUrl = "https://api.pinterest.com/v5";

async function getPinterestAccountInfo(accessToken) {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const response = await axios.get(`${baseUrl}/user_account`, {
      headers,
    });
    console.log("RES:::", response);
    console.log("RSP:::", await response?.data);
    return response.data;
  } catch (error) {
    throw new Error("Unable to access user info");
  }
}

module.exports = {
  getPinterestAccountInfo,
};
