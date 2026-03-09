const Policy = require("../../../db/schemas/onboarding/policy.schema");

const getPolicy = async (req, res) => {
  try {
    const type = req.params.type.toLowerCase().trim();

    const policy = await Policy.findOne({
      type: type,
    });

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.status(200).json(policy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const savePolicy = async (req, res) => {
  try {
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({ message: "Type & content required" });
    }

    const normalizedType = type.toLowerCase().trim();

    const policy = await Policy.findOneAndUpdate(
      { type: normalizedType },
      { content },
      { new: true, upsert: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      policy,
    });
  } catch (error) {
    // Handle invalid enum value
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getPolicy, savePolicy };
