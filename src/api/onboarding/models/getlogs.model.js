const Logs = require("../../../db/schemas/onboarding/log");

const getAllLogs = async (req, res) => {
  const response = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const { _id, userId, page = 1, limit = 100 } = req.query;

    // Build dynamic filters
    const filters = {};
    if (userId) filters.userId = userId;
    if (_id) filters._id = _id;

    const skip = (page - 1) * limit;

    // Fetch logs with pagination and sorting
    const logs = await Logs.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (!logs.length) {
      response.message = "No records found";
      return res.status(200).json(response);
    }

    // Include logs in the response
    response.data = logs;

    // Add pagination metadata
    const totalRecords = await Logs.countDocuments(filters);
    response.pagination = {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      pageSize: Number(limit),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {getAllLogs};
