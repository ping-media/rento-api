const mongoose = require("mongoose");
const MaintenanceVehicle = require("../../../db/schemas/onboarding/maintenanceVehicleSchema");
const { getVehicleTbl } = require("../models/vehicles.model");

const getMaintenanceVehicle = async (req, res) => {
  try {
    const { vehicleTableId, page = 1, limit = 20 } = req.query;
    let query = {};

    // if (vehicleTableId) {
    //   query.vehicleTableId = vehicleTableId;
    // }
    if (vehicleTableId) {
      query.vehicleTableId = mongoose.Types.ObjectId(vehicleTableId);
    }
    const skip = (page - 1) * limit;
    const maintenanceData = await MaintenanceVehicle.find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(Number(limit));

    if (!maintenanceData || maintenanceData.length === 0) {
      return res.json({
        status: 404,
        message: "No Maintenance record found.",
        data: [],
      });
    }

    // IST-aware current time
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(new Date().getTime() + IST_OFFSET_MS);
    // const now = new Date();

    // Attach isActive flag to each maintenance record
    const enrichedData = maintenanceData.map((item) => {
      const doc = item.toObject();
      const start = new Date(doc.startDate);
      const end = new Date(doc.endDate);
      doc.isActive =
        doc.status === "active" && start <= nowIST && end >= nowIST;
      return doc;
    });

    const totalRecords = await MaintenanceVehicle.count(
      vehicleTableId ? { vehicleTableId } : {},
    );
    // const totalRecords = await MaintenanceVehicle.count({
    //   vehicleTableId: vehicleTableId,
    // });

    const pagination = {
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };

    return res.json({
      status: 200,
      success: true,
      message: "Maintenance data retrieved successfully",
      data: enrichedData,
      // data: maintenanceData,
      pagination,
    });
  } catch (error) {
    console.error("Error retrieving maintenance data:", error);
    return res.json({
      status: 500,
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};

const maintenanceVehicleFunction = async (req, res) => {
  const {
    vehicleTableId,
    vehicleTableIds,
    startDate,
    endDate,
    maintenanceId,
    maintenanceIds,
    reason,
    action,
  } = req.body;

  // Validate input for new or edit operations
  if (maintenanceIds?.length === 0) {
    // if (action !== "delete" && (!vehicleTableId || !startDate || !endDate)) {
    if (
      action !== "delete" &&
      (!startDate || !endDate || (!vehicleTableId && !vehicleTableIds?.length))
    ) {
      return res.json({
        status: 400,
        success: false,
        message:
          "Missing required fields: vehicleTableId, startDate, or endDate",
      });
    }
  }

  try {
    // Validate ISO8601 format
    function isValidISO8601(dateString) {
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
      if (!iso8601Regex.test(dateString)) return false;
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    }

    if (action !== "delete" && maintenanceIds?.length === 0) {
      const startDateValidation = isValidISO8601(startDate);
      const endDateValidation = isValidISO8601(endDate);

      if (!startDateValidation || !endDateValidation) {
        return res.json({
          status: 400,
          success: false,
          message: "Invalid date format",
          data: [],
        });
      }
    }

    if (action === "delete") {
      if (maintenanceIds?.length > 0) {
        const deleted = await MaintenanceVehicle.deleteMany({
          _id: { $in: maintenanceIds.map((id) => mongoose.Types.ObjectId(id)) },
        });
        return res.status(200).json({
          status: 200,
          message: `${deleted.deletedCount} vehicle(s) deleted successfully.`,
          data: result,
        });
      }
      if (!maintenanceId) {
        return res.json({
          status: 400,
          success: false,
          message: "maintenanceId is required for deletion",
        });
      }

      const deleted = await MaintenanceVehicle.findByIdAndDelete(maintenanceId);

      if (!deleted) {
        return res.json({
          status: 404,
          success: false,
          message: "Maintenance record not found",
        });
      }

      return res.json({
        status: 200,
        success: true,
        message: "Maintenance record deleted successfully",
      });
    } else if (maintenanceIds?.length > 0) {
      // if multiple ids present
      if (!endDate) {
        return res.json({
          status: 404,
          success: false,
          message: "Unable to update the Maintenance record! try again.",
        });
      }
      const existingMaintenance = await MaintenanceVehicle.updateMany(
        { _id: { $in: maintenanceIds } },
        { $set: { endDate, status: "inactive" } },
      );
      return res.json({
        status: 200,
        success: true,
        message: `${existingMaintenance.modifiedCount} records updated`,
      });
    } else if (maintenanceId) {
      // Edit existing record
      const existingMaintenance =
        await MaintenanceVehicle.findById(maintenanceId);

      if (!existingMaintenance) {
        return res.json({
          status: 400,
          success: false,
          message: "Maintenance record not found",
        });
      }

      if (reason === "") {
        return res.json({
          status: 404,
          success: false,
          message: "Reason for Maintenance is required",
        });
      }

      existingMaintenance.endDate = endDate;
      await existingMaintenance.save();

      existingMaintenance.status = "inactive";
      await existingMaintenance.save();

      return res.json({
        status: 200,
        success: true,
        message: "Maintenance schedule updated successfully",
      });
    } else {
      const vehicleIds = vehicleTableIds?.length
        ? vehicleTableIds
        : [vehicleTableId];

      const bulkData = [];

      for (const vId of vehicleIds) {
        // check overlapping for each vehicle
        const overlappingMaintenance = await MaintenanceVehicle.findOne({
          vehicleTableId: vId,
          status: "active",
          $or: [
            {
              startDate: { $lte: startDate },
              endDate: { $gte: startDate },
            },
            {
              startDate: { $lte: endDate },
              endDate: { $gte: endDate },
            },
            {
              startDate: { $gte: startDate },
              endDate: { $lte: endDate },
            },
          ],
        });

        if (!overlappingMaintenance) {
          bulkData.push({
            vehicleTableId: vId,
            startDate,
            endDate,
            reason,
            status: "active",
          });
        }
      }

      if (bulkData.length === 0) {
        return res.json({
          status: 400,
          success: false,
          message: "All selected vehicles already have overlapping maintenance",
        });
      }

      await MaintenanceVehicle.insertMany(bulkData);

      return res.status(200).json({
        status: 200,
        success: true,
        message: `${bulkData.length} vehicle(s) added to maintenance`,
      });
    }
    // else {
    //   // Check for overlapping maintenance schedules
    //   const overlappingMaintenance = await MaintenanceVehicle.findOne({
    //     vehicleTableId: vehicleTableId,
    //     status: "active",
    //     $or: [
    //       // Case 1: New schedule starts during an existing schedule
    //       {
    //         startDate: { $lte: startDate },
    //         endDate: { $gte: startDate },
    //       },
    //       // Case 2: New schedule ends during an existing schedule
    //       {
    //         startDate: { $lte: endDate },
    //         endDate: { $gte: endDate },
    //       },
    //       // Case 3: New schedule completely contains an existing schedule
    //       {
    //         startDate: { $gte: startDate },
    //         endDate: { $lte: endDate },
    //       },
    //     ],
    //   });

    //   if (overlappingMaintenance) {
    //     return res.json({
    //       status: 400,
    //       success: false,
    //       message:
    //         "Vehicle already has a maintenance schedule that overlaps with these dates and time",
    //     });
    //   }

    //   const vehicleData = await getVehicleTbl(req.query);

    //   const data = vehicleData?.data?.filter((item) => {
    //     return item._id.toString() === vehicleTableId;
    //   });

    //   if (data.length === 0) {
    //     const maintenanceData = {
    //       vehicleTableId,
    //       startDate,
    //       endDate,
    //       reason,
    //       status: "active",
    //     };
    //     const newMaintenanceData = new MaintenanceVehicle(maintenanceData);
    //     await newMaintenanceData.save();

    //     return res.status(200).json({
    //       status: 200,
    //       success: true,
    //       message: "Vehicle successfully added to maintenance",
    //     });
    //   }

    //   return res.json({
    //     status: 404,
    //     success: false,
    //     message: "Vehicle is not available",
    //   });
    // }
  } catch (error) {
    console.error("Error during maintenance vehicle process:", error);
    return res.json({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { maintenanceVehicleFunction, getMaintenanceVehicle };
