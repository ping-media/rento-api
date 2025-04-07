const General = require("../../../db/schemas/onboarding/general.schema");

const createAndUpdateGeneral = async (req, res) => {
  const {
    weakendPrice,
    weakendPriceType,
    specialDays,
    clearSpecialDays = false,
  } = req.body;

  const allowedTypes = ["+", "-"];

  const hasWeakend =
    typeof weakendPrice === "number" && allowedTypes.includes(weakendPriceType);

  const hasSpecialDays =
    Array.isArray(specialDays) &&
    specialDays.length > 0 &&
    !specialDays.some((day) => !allowedTypes.includes(day.PriceType));

  if (!hasWeakend && !hasSpecialDays && !clearSpecialDays) {
    return res.status(400).json({
      status: 400,
      message: "Provide at least valid weakend or specialDays data to proceed.",
    });
  }

  try {
    const existingGeneral = await General.findOne();

    if (existingGeneral) {
      if (hasWeakend) {
        existingGeneral.weakend = {
          Price: weakendPrice,
          PriceType: weakendPriceType,
        };
      }

      if (clearSpecialDays) {
        existingGeneral.specialDays = [];
      } else if (hasSpecialDays) {
        existingGeneral.specialDays = specialDays;
      }

      const updated = await existingGeneral.save();

      return res.status(200).json({
        status: 200,
        success: true,
        message: clearSpecialDays
          ? "Special days cleared successfully."
          : "General settings updated successfully.",
        data: updated,
      });
    } else {
      const newGeneral = new General({
        weakend: hasWeakend
          ? {
              Price: weakendPrice,
              PriceType: weakendPriceType,
            }
          : undefined,
        specialDays: clearSpecialDays ? [] : hasSpecialDays ? specialDays : [],
      });

      const saved = await newGeneral.save();

      return res.status(200).json({
        status: 200,
        success: true,
        message: "General setting created successfully.",
        data: saved,
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Something went wrong: " + err.message,
    });
  }
};

const getGeneral = async (req, res) => {
  try {
    const generalSettings = await General.findOne();
    if (!generalSettings) {
      return res
        .status(200)
        .json({
          status: 404,
          success: false,
          message: "General settings not found.",
        });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "General settings fetched successfully.",
      data: generalSettings,
    });
  } catch (error) {
    console.error("Error fetching general settings:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Server error while fetching general settings.",
      error: error.message,
    });
  }
};

module.exports = { createAndUpdateGeneral, getGeneral };
