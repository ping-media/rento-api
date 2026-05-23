const User = require("../../../db/schemas/onboarding/user.schema");
const router = require("express").Router();

router.patch("/update-push-token", async (req, res) => {
  try {
    const { pushToken, platform, id } = req.body;

    const userId = id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "User id not found!",
      });
    }

    if (!pushToken || !platform) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Push token and platform are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found",
      });
    }

    const existingTokenIndex = user.mobileTokens.findIndex(
      (item) => item.platform === platform,
    );

    if (existingTokenIndex !== -1) {
      user.mobileTokens[existingTokenIndex] = {
        token: pushToken,
        platform,
        updatedAt: new Date(),
      };
    } else {
      user.mobileTokens.push({
        token: pushToken,
        platform,
        updatedAt: new Date(),
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Push token updated successfully",
    });
  } catch (error) {
    console.error("updatePushToken:", error);

    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
    });
  }
});
