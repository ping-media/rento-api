const { Expo } = require("expo-server-sdk");

const expo = new Expo();

/**
 * Send a push notification using Expo Server SDK
 *
 * @param token Expo push token (ExponentPushToken[...])
 * @param title Notification title
 * @param body Notification body
 * @param data Optional payload
 */
async function sendExpoNotification(token, title, body, data = {}) {
  if (!Expo.isExpoPushToken(token)) {
    throw new Error("Invalid Expo push token");
  }

  const messages = [
    {
      to: token,
      sound: "default",
      title,
      body,
      data,
    },
  ];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  try {
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }

  return tickets;
}

async function sendBulkNotifications(tokens, title, body, data = {}) {
  const validTokens = tokens.filter(Expo.isExpoPushToken);

  const messages = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  try {
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
  } catch (error) {
    console.error("Bulk notification error:", error);
  }

  return tickets;
}

module.exports = { sendExpoNotification, sendBulkNotifications };
