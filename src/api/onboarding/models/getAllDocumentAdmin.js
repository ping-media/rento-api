
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");
const Log = require("../../../db/schemas/onboarding/log")

const getAllDocument = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, type, status } = req.query;

    // Filters
    const filter = {};
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.json({
          status: 400,
          message: "Invalid User ID format.",
        });
      }
      filter.userId = mongoose.Types.ObjectId(userId);
    }
    if (type) filter.type = type;
    if (status) filter.status = status;

    // Pagination
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Fetch documents
    const documents = await Document.find(filter)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }); // Sort by creation date (most recent first)

    const totalRecords = await Document.count(filter); // Count total matching records
    const totalPages = Math.ceil(totalRecords / pageSize);

    if (!documents.length) {
      
      return res.json({
        status: 404,
        message: "No documents found.",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Documents retrieved successfully.",
      data: documents,
      pagination: {
        totalPages,
        currentPage: pageNumber,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.json({
      status: 500,
      message: "Failed to retrieve documents.",
      error: error.message,
    });
  }
};

  


module.exports = { getAllDocument };