const { sendExpoNotification } = require("./expoPush");
const User = require("../db/schemas/onboarding/user.schema");
const Log = require("../api/onboarding/models/Logs.model");

async function sendPushNotificationUsingUserId(
  userId,
  title = "Booking Alert",
  message = "You have a new booking to review",
  data = {},
) {
  if (!userId) {
    await Log({
      message: `User id not found`,
      functionName: "sendPushNotificationUsingUserId",
    });
    return { userId, success: false, reason: "Missing userId" };
  }

  const user = await User.findById(userId);
  if (!user) {
    await Log({
      message: `User not found with this id ${userId}`,
      functionName: "sendPushNotificationUsingUserId",
    });
    return { userId, success: false, reason: "User not found" };
  }

  const tokenFromDB = (user?.mobileToken && user?.mobileToken) || "";

  if (tokenFromDB === "") {
    await Log({
      message: `User mobile token not found with this id ${userId}`,
      functionName: "sendPushNotificationUsingUserId",
    });
    return { userId, success: false, reason: "Mobile token not found" };
  }

  await sendExpoNotification(tokenFromDB, title, message, data);
  return { userId, success: true };
}

async function sendPushNotificationToMany(
  userIds = [],
  title = "Booking Alert",
  message = "You have a new booking to review",
  data = {},
) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  const results = await Promise.allSettled(
    userIds.map((userId) =>
      sendPushNotificationUsingUserId(userId, title, message, data),
    ),
  );

  const normalized = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          userId: userIds[i],
          success: false,
          reason: r.reason?.message || "Unknown error",
        },
  );

  return {
    sent: normalized.filter((r) => r.success).length,
    failed: normalized.filter((r) => !r.success).length,
    results: normalized,
  };
}

module.exports = {
  sendPushNotificationUsingUserId,
  sendPushNotificationToMany,
};
