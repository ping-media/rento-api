const mongoose = require("mongoose");
const Mechanic = require("../../../db/schemas/onboarding/mechanic.schema");

const createMechanic = async (req, res) => {
  try {
    const { name, phone, specialisation } = req.body;
    if (!name?.trim()) {
      return res.json({
        status: 400,
        success: false,
        message: "Mechanic name is required",
      });
    }
    const mechanic = await Mechanic.create({ name, phone, specialisation });
    return res.json({
      status: 200,
      success: true,
      message: "Mechanic created",
      data: mechanic,
    });
  } catch (error) {
    console.error("createMechanic error:", error);
    return res.json({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

const listMechanics = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;
    const mechanics = await Mechanic.find(filter).sort({ name: 1 });
    return res.json({ status: 200, success: true, data: mechanics });
  } catch (error) {
    console.error("listMechanics error:", error);
    return res.json({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

// also used to deactivate: send { mechanicId, isActive: false }
const updateMechanic = async (req, res) => {
  try {
    const { mechanicId, name, phone, specialisation, isActive } = req.body;
    if (!mongoose.isValidObjectId(mechanicId)) {
      return res.json({
        status: 400,
        success: false,
        message: "Valid mechanicId is required",
      });
    }
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (specialisation !== undefined) update.specialisation = specialisation;
    if (isActive !== undefined) update.isActive = !!isActive;

    const mechanic = await Mechanic.findByIdAndUpdate(
      mechanicId,
      { $set: update },
      { new: true },
    );
    if (!mechanic) {
      return res.json({
        status: 404,
        success: false,
        message: "Mechanic not found",
      });
    }
    return res.json({
      status: 200,
      success: true,
      message: "Mechanic updated",
      data: mechanic,
    });
  } catch (error) {
    console.error("updateMechanic error:", error);
    return res.json({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { createMechanic, listMechanics, updateMechanic };
