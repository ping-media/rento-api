const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const mongoose = require("mongoose")

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
        $lookup: {
          from: 'stations', // Collection name for vehicle masters
          localField: 'stationId', // Field from vehicleTable
          foreignField: 'stationId', // Field from vehiclemasters
          as: 'stationData' // Alias for the joined data
        }
      },
      {
        $unwind: { path: '$vehicleMasterData', preserveNullAndEmptyArrays: true }, // Optional: this ensures the join will not drop records with no match
      },
      {
        $unwind: { path: '$stationData', preserveNullAndEmptyArrays: true } // Optional: this ensures the join will not drop records with no match

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
          "locationId":1,
          "stationName":"$stationData.stationName",
          "vehicleImage": "$vehicleMasterData.vehicleImage" ,
          "vehicleName": "$vehicleMasterData.vehicleName" ,
          "createdAt": 1,
          "updatedAt": 1,
        }
      }
    ]);

    if (!vehicles.length) {
      obj.message = "No records found";
      obj.status = 400;

      return res.json(obj);
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

const updateMultipleVehicles = async (req, res) => {
  const { vehicleIds, updateData, deleteRec } = req.body;

  // Ensure valid vehicleIds and updateData
  if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
    return res.status(400).json({
      status: 400,
      message: "Invalid vehicle IDs"
    });
  }

  if (deleteRec){
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
    return res.status(400).json({
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
