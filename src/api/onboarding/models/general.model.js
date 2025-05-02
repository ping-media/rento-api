const { mongoose } = require("mongoose");
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

const manageExtraAddOn = async (req, res) => {
  const { id, name, amount, maxAmount, status, delete: deleteFlag } = req.body;

  const isCreate =
    !id &&
    name &&
    typeof amount === "number" &&
    typeof maxAmount === "number" &&
    ["active", "inactive"].includes(status);

  const isUpdate =
    id &&
    (name ||
      typeof amount === "number" ||
      typeof maxAmount === "number" ||
      ["active", "inactive"].includes(status));

  const isDelete = id && deleteFlag === true;

  if (!isCreate && !isUpdate && !isDelete) {
    return res.status(400).json({
      status: 400,
      message: "Invalid request. No Data Found.",
    });
  }

  try {
    const general = await General.findOne();
    if (!general) {
      return res.status(404).json({
        status: 404,
        message: "General settings document not found.",
      });
    }

    if (isDelete) {
      const index = general.extraAddOn.findIndex(
        (item) => item._id.toString() === id
      );
      if (index === -1) {
        return res
          .status(404)
          .json({ status: 404, message: "Add-on not found." });
      }

      general.extraAddOn.splice(index, 1);
      await general.save();

      return res.status(200).json({
        status: 200,
        message: `Add-on deleted successfully.`,
      });
    }

    if (isUpdate) {
      const addOn = general.extraAddOn.find(
        (item) => item._id.toString() === id
      );
      if (!addOn) {
        return res
          .status(404)
          .json({ status: 404, message: "Add-on not found." });
      }

      if (name) addOn.name = name;
      if (typeof amount === "number") addOn.amount = amount;
      if (typeof maxAmount === "number") addOn.maxAmount = maxAmount;
      if (["active", "inactive"].includes(status)) addOn.status = status;

      await general.save();

      return res.status(200).json({
        status: 200,
        message: `Add-on updated successfully.`,
      });
    }

    if (isCreate) {
      const alreadyExists = general.extraAddOn.some(
        (item) => item.name === name
      );
      if (alreadyExists) {
        return res.json({
          status: 400,
          message: `Add-on with name '${name}' already exists.`,
        });
      }

      general.extraAddOn.push({
        _id: new mongoose.Types.ObjectId(),
        name,
        amount,
        maxAmount,
        status,
      });

      const saved = await general.save();
      const newAddOn = saved.extraAddOn[saved.extraAddOn.length - 1];

      return res.status(200).json({
        status: 200,
        message: `Add-on '${name}' created successfully.`,
        data: newAddOn,
      });
    }
  } catch (err) {
    return res.json({
      status: 500,
      message: "Server error: " + err.message,
    });
  }
};

const getGeneral = async (req, res) => {
  try {
    const generalSettings = await General.findOne();
    if (!generalSettings) {
      return res.status(200).json({
        status: 404,
        success: false,
        message: "General settings not found.",
      });
    }
    const { extraAddOn, __v, ...rest } = generalSettings.toObject();

    res.status(200).json({
      status: 200,
      success: true,
      message: "General settings fetched successfully.",
      data: rest,
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

const getExtraAddOns = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const general = await General.findOne({}, { extraAddOn: 1 });

    if (!general || !general.extraAddOn) {
      return res.status(404).json({
        status: 404,
        message: "No extra add-ons found.",
        data: [],
      });
    }

    const total = general.extraAddOn.length;
    const paginated = general.extraAddOn.slice(skip, skip + limit);

    return res.status(200).json({
      status: 200,
      message: "Extra add-ons fetched successfully.",
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "Server error: " + err.message,
    });
  }
};

module.exports = {
  createAndUpdateGeneral,
  manageExtraAddOn,
  getExtraAddOns,
  getGeneral,
};
