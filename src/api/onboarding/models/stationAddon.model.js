const Station = require("../../../db/schemas/onboarding/station.schema");

const handleStationAddon = async (req, res) => {
  const {
    stationId,
    _id,
    name,
    amount,
    maxAmount,
    gstPercentage,
    gstStatus,
    status,
    action,
  } = req.body;

  if (!stationId) {
    return res
      .status(400)
      .json({ success: false, message: "Station ID is required" });
  }

  try {
    const station = await Station.findById(stationId);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found with given station id! try again",
      });
    }

    if (isNaN(Number(gstPercentage))) {
      return res.status(404).json({
        success: false,
        message: "gst percentage is not a valid number! try again",
      });
    }

    if (action === "create") {
      const newAddon = {
        name,
        amount,
        maxAmount,
        gstPercentage: Number(gstPercentage),
        gstStatus,
        status,
      };
      station.extraAddOn.push(newAddon);
      await station.save();
      return res.status(201).json({
        success: true,
        message: "AddOn created successfully",
        data: station.extraAddOn,
      });
    }

    if (action === "update") {
      if (!_id) {
        return res.status(400).json({
          success: false,
          message: "AddOn _id is required for update",
        });
      }

      const addon = station.extraAddOn.id(_id);
      if (!addon) {
        return res.status(404).json({
          success: false,
          message: "AddOn not found",
        });
      }

      if (name !== undefined) addon.name = name;
      if (amount !== undefined) addon.amount = amount;
      if (maxAmount !== undefined) addon.maxAmount = maxAmount;
      if (gstPercentage !== undefined)
        addon.gstPercentage = Number(gstPercentage);
      if (gstStatus !== undefined) addon.gstStatus = gstStatus;
      if (status !== undefined) addon.status = status;

      await station.save();
      return res.status(200).json({
        success: true,
        message: "AddOn updated successfully",
        data: station.extraAddOn,
      });
    }

    if (action === "delete") {
      if (!_id) {
        return res.status(400).json({
          success: false,
          message: "AddOn _id is required for delete",
        });
      }

      const addon = station.extraAddOn.id(_id);
      if (!addon) {
        return res.status(404).json({
          success: false,
          message: "AddOn not found",
        });
      }

      addon.remove();
      await station.save();

      return res.status(200).json({
        success: true,
        message: "AddOn deleted successfully",
        data: station.extraAddOn,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid action. Use create, update, or delete",
    });
  } catch (error) {
    console.error("Error in handleStationAddon:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  handleStationAddon,
};
