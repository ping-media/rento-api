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
  const response = {
    status: 200,
    message: "Data fetched successfully",
    data: [],
  };

  try {
    const {
      _id,
      vehicleMasterId,
      stationId,
      vehicleStatus,
      vehicleColor,
      condition,
      vehicleName,
      stationName,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (vehicleMasterId)
      filter.vehicleMasterId = mongoose.Types.ObjectId(vehicleMasterId);
    if (stationId) filter.stationId = stationId;
    if (vehicleStatus) filter.vehicleStatus = vehicleStatus;
    if (vehicleColor) filter.vehicleColor = vehicleColor;
    if (condition) filter.condition = condition;
    if (vehicleName) filter.vehicleName = vehicleName;
    if (_id) filter._id = mongoose.Types.ObjectId(_id);

    let stationNameFilter = {};
    if (stationName) {
      stationNameFilter = { "stationData.stationName": stationName };
    }

    if (search) {
      filter.$or = [
        { vehicleName: { $regex: search, $options: "i" } },
        { stationName: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } },
        { vehicleStatus: { $regex: search, $options: "i" } },
      ];
    }

    const parsedPage = Math.max(parseInt(page, 10), 1);
    const parsedLimit = Math.max(parseInt(limit, 10), 1);

    const vehicles = await vehicleTable.aggregate([
      {
        $lookup: {
          from: "vehiclemasters",
          localField: "vehicleMasterId",
          foreignField: "_id",
          as: "vehicleMasterData",
        },
      },
      {
        $lookup: {
          from: "stations",
          localField: "stationId",
          foreignField: "stationId",
          as: "stationData",
        },
      },

      ...(stationName ? [{ $match: stationNameFilter }] : []),
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "vehicleId",
          as: "bookingData",
        },
      },
      {
        $addFields: {
          bookingStatus: {
            $cond: {
              if: { $gt: [{ $size: "$bookingData" }, 0] },
              then: "Booked",
              else: "Available",
            },
          },
        },
      },
      {
        $unwind: {
          path: "$vehicleMasterData",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $unwind: { path: "$stationData", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$bookingData", preserveNullAndEmptyArrays: true } },
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
          vehiclePlan: 1,
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
          lastMeterReading: 1,
          stationName: "$stationData.stationName",
          vehicleImage: "$vehicleMasterData.vehicleImage",
          vehicleName: "$vehicleMasterData.vehicleName",
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          totalCount: [{ $count: "totalRecords" }],
          data: [
            { $skip: (parsedPage - 1) * parsedLimit },
            { $limit: parsedLimit },
          ],
        },
      },
    ]);

    if (!vehicles.length || !vehicles[0].totalCount.length) {
      return res.json({
        status: 404,
        message: "No records found",
        data: [],
        pagination: {
          totalPages: 0,
          currentPage: parsedPage,
          limit: parsedLimit,
        },
      });
    }

    const totalRecords = vehicles[0].totalCount[0]?.totalRecords || 0;
    const totalPages = Math.ceil(totalRecords / parsedLimit);

    const data = vehicles[0].data || [];

    return res.json({
      status: 200,
      message: "Data fetched successfully",
      data,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error("Error fetching vehicle data:", error.message);
    response.status = 500;
    response.message = "An error occurred while fetching vehicle data";
    return res.json(response);
  }
};

const updateMultipleVehicles = async (req, res) => {
  const { vehicleIds, updateData, deleteRec, vehiclePlan } = req.body;

  if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
    return res.json({
      status: 400,
      message: "Invalid vehicle IDs",
    });
  }

  if (deleteRec) {
    const result = await vehicleTable.deleteMany({
      _id: { $in: vehicleIds.map((id) => mongoose.Types.ObjectId(id)) },
    });

    return res.status(200).json({
      status: 200,
      message: `${result.deletedCount} vehicle(s) deleted successfully.`,
      data: result,
    });
  }

  if (!updateData || typeof updateData !== "object") {
    return res.json({
      status: 400,
      message: "Invalid update data",
    });
  }

  const objectIds = vehicleIds.map((id) => mongoose.Types.ObjectId(id));
  const filter = { _id: { $in: objectIds } };

  if (vehiclePlan && Array.isArray(vehiclePlan)) {
    const vehicles = await vehicleTable.find({
      _id: { $in: objectIds },
      vehiclePlan: { $exists: true, $not: { $size: 0 } },
    });

    for (const vehicle of vehicles) {
      let updated = false;

      const updatedPlan = vehicle.vehiclePlan.map((plan) => {
        const match = vehiclePlan.find((p) => p._id === String(plan._id));
        if (match) {
          updated = true;
          return { ...plan.toObject(), planPrice: match.planPrice };
        }
        return plan;
      });

      if (updated) {
        await vehicleTable.updateOne(
          { _id: vehicle._id },
          { $set: { vehiclePlan: updatedPlan } }
        );
      }
    }
  }

  const { vehiclePlan: _, ...restUpdateData } = updateData;

  const result = await updateManyVehicles(filter, restUpdateData);

  return res.status(result.status).json(result);
};

module.exports = { getAllVehiclesData, updateMultipleVehicles };
