const { sendExpoNotification } = require("./expoPush");
const User = require("../db/schemas/onboarding/user.schema");

async function sendPushNotificationUsingUserId(
  userId,
  title = "🚨 Booking Alert",
  message = "You have a new booking to review",
  data = {}
) {
  if (!userId && data == {}) {
    return null;
  }

  const user = User.findById(userId);
  if (!user) {
    return null;
  }

  const tokenFromDB =
    user?.mobileToken && user?.mobileToken !== "" ? user?.mobileToken : "";

  if (tokenFromDB === "") {
    return null;
  }

  await sendExpoNotification(tokenFromDB, title, message, data);
  // { bookingId: "abc123" }
}

module.exports = { sendPushNotificationUsingUserId };
