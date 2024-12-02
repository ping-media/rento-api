
const Document = require("../../../db/schemas/onboarding/DocumentUpload.Schema");


const getAllDocument = async (req, res) => {
    try {
     
  
      const documents = await Document.find({  });
  
      if (!documents || documents.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "No documents found for the provided User ID.",
        });
      }
  
      return res.status(200).json({
        status: 200,
        message: "Documents retrieved successfully.",
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({
        status: 500,
        message: "Failed to retrieve documents.",
        error: error.message,
      });
    }
  };
  


module.exports = { getAllDocument };