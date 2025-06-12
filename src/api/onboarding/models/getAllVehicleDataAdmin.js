const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const MaintenanceVehicle = require("../../../db/schemas/onboarding/maintenanceVehicleSchema");
const mongoose = require("mongoose");

const updateManyVehicles = async (filter, updateData) => {
  try {
    if (typeof updateData !== "object" || Array.isArray(updateData)) {
      throw new Error("Update data must be an object");
    }

    // Perform the updateMany operation
    const result = await vehicleTable.updateMany(filter, { $set: updateData });

    return {
      status: 200,
      message: `${result.modifiedCount} vehicle(s) updated successfully.`,
      data: result,
    };
  } catch (error) {
    console.error("Error during updateMany:", error.message);

    // Return error response
    return {
      status: 500,
      message: `Error during updateMany: ${error.message}`,
      data: [],
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
      condition,
      vehicleName,
      vehicleBrand,
      stationName,
      search,
      maintenanceType,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (vehicleMasterId)
      filter.vehicleMasterId = mongoose.Types.ObjectId(vehicleMasterId);
    if (stationId) filter.stationId = stationId;

    if (vehicleStatus)
      filter.vehicleStatus = { $regex: vehicleStatus, $options: "i" };
    if (condition) filter.condition = { $regex: condition, $options: "i" };
    if (vehicleName)
      filter.vehicleName = { $regex: vehicleName, $options: "i" };
    if (vehicleBrand)
      filter.vehicleBrand = { $regex: vehicleBrand, $options: "i" };
    if (_id) filter._id = mongoose.Types.ObjectId(_id);

    let stationNameFilter = {};
    if (stationName) {
      stationNameFilter = {
        "stationData.stationName": {
          $regex: stationName,
          $options: "i",
        },
      };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      filter.$or = [
        { vehicleName: searchRegex },
        { vehicleBrand: searchRegex },
        { stationName: searchRegex },
        { vehicleNumber: searchRegex },
        { vehicleStatus: searchRegex },
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
          vehicleBrand: "$vehicleMasterData.vehicleBrand",
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

    let filteredVehicles = [];

    if (data.length > 0) {
      const vehicleIds = data.map((vehicle) => vehicle._id);
      const today = new Date().toISOString().split("T")[0];

      let maintenanceData = [];

      const baseFilter = {
        vehicleTableId: { $in: vehicleIds },
      };

      if (maintenanceType) {
        if (maintenanceType === "upcoming") {
          baseFilter.endDate = { $gte: today };
        } else if (maintenanceType === "expired") {
          baseFilter.endDate = { $lt: today };
        }

        maintenanceData = await MaintenanceVehicle.find(baseFilter).sort({
          createdAt: -1,
        });
      } else {
        maintenanceData = await MaintenanceVehicle.find(baseFilter)
          .sort({ createdAt: -1 })
          .limit(20);
      }

      // Map maintenance data back to vehicles
      const maintenanceMap = {};
      maintenanceData.forEach((item) => {
        const vehicleId = item.vehicleTableId.toString();
        if (!maintenanceMap[vehicleId]) {
          maintenanceMap[vehicleId] = [];
        }
        maintenanceMap[vehicleId].push(item);
      });

      filteredVehicles = data
        .map((vehicle) => {
          const vehicleId = vehicle._id.toString();
          const maintenance = maintenanceMap[vehicleId] || [];
          vehicle.maintenance = maintenance;

          return vehicle;
        })
        .filter((vehicle) => {
          if (maintenanceType === "upcoming") {
            return vehicle.maintenance.some((m) => m.endDate >= today);
          } else if (maintenanceType === "expired") {
            return vehicle.maintenance.some((m) => m.endDate < today);
          }
          return true;
        });
    }

    const finalData = filteredVehicles?.length > 0 ? filteredVehicles : data;
    let finalTotalRecords = totalRecords;
    let finalTotalPages = totalPages;

    console.log(finalData, filteredVehicles);

    // If we're filtering by maintenance type, we need to adjust the total records and pages
    if (maintenanceType && filteredVehicles.length > 0) {
      // Count all vehicles that match the maintenance type filter
      const allVehicles = await vehicleTable.aggregate([
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
        { $match: filter },
        { $project: { _id: 1 } },
      ]);

      // Get all vehicle IDs
      const allVehicleIds = allVehicles.map((v) => v._id);

      // Get maintenance data for all vehicles based on the filter
      const allMaintenanceFilter = {
        vehicleTableId: { $in: allVehicleIds },
      };

      if (maintenanceType === "upcoming") {
        allMaintenanceFilter.endDate = { $gte: today };
      } else if (maintenanceType === "expired") {
        allMaintenanceFilter.endDate = { $lt: today };
      }

      const allMaintenance = await MaintenanceVehicle.find(
        allMaintenanceFilter
      );

      // Get unique vehicle IDs that have maintenance matching the filter
      const vehicleIdsWithMatchingMaintenance = [
        ...new Set(
          allMaintenance.map((item) => item.vehicleTableId.toString())
        ),
      ];

      finalTotalRecords = vehicleIdsWithMatchingMaintenance.length;
      finalTotalPages = Math.ceil(finalTotalRecords / parsedLimit);
    }

    return res.json({
      status: 200,
      message: "Data fetched successfully",
      data: finalData,
      pagination: {
        totalRecords: finalTotalRecords,
        totalPages: finalTotalPages,
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

  // if (vehiclePlan && Array.isArray(vehiclePlan)) {
  //   const vehicles = await vehicleTable.find({
  //     _id: { $in: objectIds },
  //     vehiclePlan: { $exists: true, $not: { $size: 0 } },
  //   });

  //   for (const vehicle of vehicles) {
  //     let updated = false;

  //     const updatedPlan = vehicle.vehiclePlan.map((plan) => {
  //       const match = vehiclePlan.find((p) => p._id === String(plan._id));
  //       if (match) {
  //         updated = true;
  //         return { ...plan.toObject(), planPrice: match.planPrice };
  //       }
  //       return plan;
  //     });

  //     if (updated) {
  //       await vehicleTable.updateOne(
  //         { _id: vehicle._id },
  //         { $set: { vehiclePlan: updatedPlan } }
  //       );
  //     }
  //   }
  // }

  if (vehiclePlan && Array.isArray(vehiclePlan)) {
    const vehicles = await vehicleTable.find({
      _id: { $in: objectIds },
    });

    for (const vehicle of vehicles) {
      let updatedPlan = Array.isArray(vehicle.vehiclePlan)
        ? [...vehicle.vehiclePlan]
        : [];

      let updated = false;

      // Update existing plans if matching
      updatedPlan = updatedPlan.map((plan) => {
        const match = vehiclePlan.find((p) => p._id === String(plan._id));
        if (match) {
          updated = true;
          return { ...(plan.toObject?.() ?? plan), planPrice: match.planPrice };
        }
        return plan;
      });

      // Add new plans not already present
      for (const newPlan of vehiclePlan) {
        const exists = updatedPlan.some((p) => String(p._id) === newPlan._id);
        if (!exists) {
          updatedPlan.push({
            _id: newPlan._id,
            planPrice: newPlan.planPrice,
            planName: newPlan.planName || "",
            planDuration: newPlan.planDuration || "",
          });
          updated = true;
        }
      }

      if (updated) {
        await vehicleTable.updateOne(
          { _id: vehicle._id },
          { $set: { vehiclePlan: updatedPlan } }
        );
      }
    }
  }

  // const { vehiclePlan: _, ...restUpdateData } = updateData;
  const result = await updateManyVehicles(filter, updateData);

  return res.status(result.status).json(result);
};

module.exports = { getAllVehiclesData, updateMultipleVehicles };
