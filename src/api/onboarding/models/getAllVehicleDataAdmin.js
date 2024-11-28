const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");

const getAllVehiclesData = async (req, res) => {
    const obj = { status: 200, message: "Data fetched successfully", data: [] };

  try {
    const { _id,vehicleMasterId, stationId, vehicleStatus, vehicleColor, condition, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = {};
    if (vehicleMasterId) filter.vehicleMasterId = vehicleMasterId;
    if (stationId) filter.stationId = stationId;
    if (vehicleStatus) filter.vehicleStatus = vehicleStatus;
    if (vehicleColor) filter.vehicleColor = vehicleColor;
    if (condition) filter.condition = condition;
    if (_id) filter._id=_id

    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vehicles = await vehicleTable
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      

    const totalRecords = await vehicleTable.find(filter);
    // Return the result
    obj.status= 200
    obj.message= 'Vehicles retrieved successfully'
      obj.data= vehicles
      obj.currentPage= parseInt(page)
      obj.totalPages= Math.ceil(totalRecords.length / parseInt(limit))
    return res.status(200).json(
      obj
    );

    
  } catch (error) {
    console.error('Error fetching vehicleTable records:', error.message);
    obj.status = 500;
    obj.message = "An error occurred while fetching vehicleTable records";
    return res.status(500).json(
    obj
    );
  }
 // return obj
};

module.exports = { getAllVehiclesData };
