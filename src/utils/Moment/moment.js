const moment = require("moment");

exports.getYoutubeTokenValidity = () => {
  return moment().add(59, "minutes").toDate();
};
