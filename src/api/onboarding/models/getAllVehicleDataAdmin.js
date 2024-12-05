const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const mongoose = require("mongoose")

const getAllVehiclesData = async (req, res) => {
  const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const { _id, vehicleMasterId, stationId, vehicleStatus, vehicleColor, condition } = req.query;

    const filter = {};
    
    if (vehicleMasterId) filter.vehicleMasterId = mongoose.Types.ObjectId(vehicleMasterId);
    if (stationId) filter.stationId = stationId;
    if (vehicleStatus) filter.vehicleStatus = vehicleStatus;
    if (vehicleColor) filter.vehicleColor = vehicleColor;
    if (condition) filter.condition = condition;
    if (_id) filter._id = mongoose.Types.ObjectId(_id);
    const vehicles = await vehicleTable.aggregate([
      {
        $match: filter 
      },
      {
        $lookup: {
          from: 'vehiclemasters', // Collection name for vehicle masters
          localField: 'vehicleMasterId', // Field from vehicleTable
          foreignField: '_id', // Field from vehiclemasters
          as: 'vehicleMasterData' // Alias for the joined data
        }
      },
      {
        $unwind: { path: '$vehicleMasterData', preserveNullAndEmptyArrays: true } // Optional: this ensures the join will not drop records with no match
      },
      {
        $project: {
          "_id": 1,
          "vehicleMasterId": 1,
          "vehicleBookingStatus": 1,
          "vehicleStatus": 1,
          "freeKms": 1,
          "extraKmsCharges": 1,
          "stationId": 1,
          "vehicleNumber": 1,
          "vehicleModel": 1,
          "vehicleColor": 1,
          "perDayCost": 1,
          "lastServiceDate": 1,
          "kmsRun": 1,
          "isBooked": 1,
          "condition": 1,
          "createdAt": 1,
          "updatedAt": 1,
          
          "vehicleImage": "$vehicleMasterData.vehicleImage" 
        }
      }
    ]);

    if (!vehicles.length) {
      obj.message = "No records found";
      obj.status = 404;

      return res.status(404).json(obj);
    }

    obj.data = vehicles;
    return res.status(200).json(obj);

  } catch (error) {
    console.error('Error fetching vehicleTable records:', error.message);
    obj.status = 500;
    obj.message = "An error occurred while fetching vehicleTable records";
    return res.status(500).json(obj);
  }
};

module.exports = { getAllVehiclesData };
