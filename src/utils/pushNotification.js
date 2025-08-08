const { sendExpoNotification } = require("./expoPush");
const User = require("../db/schemas/onboarding/user.schema");
const Log = require("../api/onboarding/models/Logs.model");

async function sendPushNotificationUsingUserId(
  userId,
  title = "🚨 Booking Alert",
  message = "You have a new booking to review",
  data = {}
) {
  if (!userId) {
    await Log({
      message: `User id not found`,
      functionName: "sendPushNotificationUsingUserId",
    });
    return null;
  }

  const user = await User.findById(userId);
  if (!user) {
    await Log({
      message: `User not found with this id ${userId}`,
      functionName: "sendPushNotificationUsingUserId",
    });
    return null;
  }

  const tokenFromDB =
    user?.mobileToken && user?.mobileToken !== "" ? user?.mobileToken : "";

  if (tokenFromDB === "") {
    await Log({
      message: `User mobile token not found with this id ${userId}`,
      functionName: "sendPushNotificationUsingUserId",
    });
    return null;
  }

  await sendExpoNotification(tokenFromDB, title, message, data);
}

module.exports = { sendPushNotificationUsingUserId };
