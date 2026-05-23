import User from "../db/schemas/onboarding/user.schema";

export async function updatePushToken(userId, pushToken) {
  try {
    if (!userId || !pushToken || pushToken.trim() === "") {
      return {
        success: false,
        message: "User id and push token are required",
      };
    }

    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $set: {
          mobileToken: pushToken,
        },
      },
    );

    return {
      success: updateResult.modifiedCount > 0,
      modifiedCount: updateResult.modifiedCount,
    };
  } catch (error) {
    console.error("Push token update error:", error);

    return {
      success: false,
      message: error.message,
    };
  }
}
