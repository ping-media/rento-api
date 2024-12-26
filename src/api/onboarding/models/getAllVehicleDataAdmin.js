const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")

const updateManyVehicles = async (filter, updateData) => {
  try {
    if (typeof updateData !== 'object' || Array.isArray(updateData)) {
      throw new Error('Update data must be an object');
    }



    // Perform the updateMany operation
    const result = await vehicleTable.updateMany(filter, { $set: updateData });



    return {
      status: 200,
      message: `${result.modifiedCount} vehicle(s) updated successfully.`,
      data: result
    };
  } catch (error) {
    console.error('Error during updateMany:', error.message);

    // Return error response
    return {
      status: 500,
      message: `Error during updateMany: ${error.message}`,
      data: []
    };
  }
};


const getAllVehiclesData = async (req, res) => {
  const response = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const {
      _id,
      vehicleMasterId,
      stationId,
      vehicleStatus,
      vehicleColor,
      condition,
      vehicleName,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    

    // Build filter criteria
    const filter = {};
    if (vehicleMasterId) filter.vehicleMasterId = mongoose.Types.ObjectId(vehicleMasterId);
    if (stationId) filter.stationId = stationId;
    if (vehicleStatus) filter.vehicleStatus = vehicleStatus;
    if (vehicleColor) filter.vehicleColor = vehicleColor;
    if (condition) filter.condition = condition;
    if (vehicleName) filter.vehicleName = vehicleName;
    if (_id) filter._id = mongoose.Types.ObjectId(_id);


    if (search) {
      filter.$or = [
        { vehicleName: { $regex: search, $options: "i" } },
        { stationName: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } },
        { vehicleStatus: { $regex: search, $options: "i" } },
      ];
    }

    // Parse pagination parameters
    const parsedPage = Math.max(parseInt(page, 10), 1);
    const parsedLimit = Math.max(parseInt(limit, 10), 1);

    // Aggregate query
    const vehicles = await vehicleTable.aggregate([
      

      // Join with vehicle masters collection
      {
        $lookup: {
          from: "vehiclemasters",
          localField: "vehicleMasterId",
          foreignField: "_id",
          as: "vehicleMasterData",
        },
      },

      // Join with stations collection
      {
        $lookup: {
          from: "stations",
          localField: "stationId",
          foreignField: "stationId",
          as: "stationData",
        },
      },

      // Unwind joined arrays
      { $unwind: { path: "$vehicleMasterData", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$stationData", preserveNullAndEmptyArrays: true } },

      // Project only the required fields
      {
        $project: {
          _id: 1,
          vehicleMasterId: 1,
          vehicleBookingStatus: 1,
          vehicleStatus: 1,
         freeKms: 1,
         extraKmsCharges: 1,
          stationId: 1,
          vehicleNumber: 1,
          vehiclePlan:1,
          vehicleModel: 1,
         vehicleColor: 1,
          perDayCost: 1,
          lastServiceDate: 1,
          kmsRun: 1,
         condition: 1,
          locationId: 1,
         refundableDeposit: 1,
         lateFee: 1,
         speedLimit: 1,
          stationName: "$stationData.stationName",
         vehicleImage: "$vehicleMasterData.vehicleImage",
          vehicleName: "$vehicleMasterData.vehicleName",
          createdAt: 1,
          updatedAt: 1,
        },
      },

      // Match filter criteria
      { $match: filter },

      // Pagination using $facet
      {
        $facet: {
          pagination: [
            { $count: "total" },
            { $addFields: { page: parsedPage, limit: parsedLimit } },
          ],
          data: [
            { $skip: (parsedPage - 1) * parsedLimit },
            { $limit: parsedLimit },
          ],
        },
      },
    ]);

    // Handle empty results
    if (!vehicles.length || !vehicles[0].data.length) {
      response.status = 404;
      response.message = "No records found";
      return res.json(response);
    }

    // Attach metadata and data to response
    const pagination = vehicles[0].pagination[0] || { total: 0, currentPage: parsedPage, limit: parsedLimit };
    response.data = vehicles[0].data;
    response.pagination = pagination;

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching vehicle data:", error.message);
    response.status = 500;
    response.message = "An error occurred while fetching vehicle data";
    return res.json(response);
  }
};



const updateMultipleVehicles = async (req, res) => {
  const { vehicleIds, updateData, deleteRec } = req.body;

  // Ensure valid vehicleIds and updateData
  if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
    return res.json({
      status: 400,
      message: "Invalid vehicle IDs"
    });
  }

  if (deleteRec) {
    const result = await vehicleTable.deleteMany({
      _id: { $in: vehicleIds.map(id => mongoose.Types.ObjectId(id)) }
    });

    return res.status(200).json({
      status: 200,
      message: `${result.deletedCount} vehicle(s) deleted successfully.`,
      data: result
    });
  }

  if (!updateData || typeof updateData !== 'object') {
    return res.json({
      status: 400,
      message: "Invalid update data"
    });
  }




  // Filter for the vehicles to be updated
  const filter = { _id: { $in: vehicleIds.map(id => mongoose.Types.ObjectId(id)) } };

  // Call the updateMany function to update the vehicles
  const result = await updateManyVehicles(filter, updateData);

  return res.status(result.status).json(result);
};

module.exports = { getAllVehiclesData, updateMultipleVehicles };
