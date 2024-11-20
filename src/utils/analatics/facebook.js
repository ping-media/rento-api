const axios = require('axios');

async function getFacebookInsights(pageAccessToken, pageId, duration) {
  const baseUrl = `https://graph.facebook.com/v9.0/${pageId}/insights`;
  const newLikes = `${baseUrl}?metric=page_fans,page_fans_country,page_negative_feedback&access_token=${pageAccessToken}&period=${duration}`;
  const postAndEngagement = `${baseUrl}?metric=post_engagements,post_reactions_by_type_total&access_token=${pageAccessToken}&period=${duration}`;
  const performance = `${baseUrl}?metric=page_views_total,page_clicks_by_outbound_click_total,page_impressions,page_impressions_organic&access_token=${pageAccessToken}&period=${duration}`;
  const impression = `${baseUrl}?metric=page_impressions,page_reach,page_impressions_organic&access_token=${pageAccessToken}&period=${duration}`;
  const topCountry = `${baseUrl}?metric=page_impressions_by_country_total&access_token=${pageAccessToken}&period=${duration}`;

  try {
    const [newLikesRes, postAndEngagementRes, performanceRes, impressionRes, topCountryRes] = await Promise.all([
      axios.get(newLikes),
      axios.get(postAndEngagement),
    //   axios.get(performance),
      axios.get(impression),
      axios.get(topCountry),
    ]);

    return {
      newLikes: newLikesRes.data.data,
      postAndEngagementSummary: postAndEngagementRes.data.data,
    //   performanceSummary: performanceRes.data.data,
      impressionSummary: impressionRes.data.data,
    //   topCountry: topCountryRes.data.data,
    };
  } catch (error) {
    console.error(error);
    return error;
  }
}

const pageAccessToken = 'EAAIsNNk0iokBABFL380CXhFFN4qU6dka0feQgQUm0KiZC6Yyujq0FuaKuEIF43uBOCJfQEg7XdDOO2MgyR7M0f1K1dDoJozCZBbyUZBNvFkRUbXTxlpxoDavmvvf4dpDaKQsts0ZBw1zav6LCRokYvYJZCD0RRuWm8a2BH4ZAzFLQAAh7n7Yi8';
const pageId = '101745446142661';
const duration = 'week';

getFacebookInsights(pageAccessToken, pageId, duration).then((res) => {
    console.log(res);
});

module.exports = {
    getFacebookInsights,
};
