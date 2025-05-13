const MaintenanceVehicle = require("../../../db/schemas/onboarding/maintenanceVehicleSchema");
const { getVehicleTbl } = require("../models/vehicles.model");

const getMaintenanceVehicle = async (req, res) => {
  try {
    const { vehicleTableId, page = 1, limit = 20 } = req.query;
    let query = {};

    if (vehicleTableId) {
      query.vehicleTableId = vehicleTableId;
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

    const totalRecords = await MaintenanceVehicle.count({
      vehicleTableId: vehicleTableId,
    });

    const pagination = {
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };

    return res.json({
      status: 200,
      success: true,
      message: "Maintenance data retrieved successfully",
      data: maintenanceData,
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
    startDate,
    endDate,
    maintenanceId,
    maintenanceIds,
    reason,
    action,
  } = req.body;

  // Validate input for new or edit operations
  if (maintenanceIds?.length === 0) {
    if (action !== "delete" && (!vehicleTableId || !startDate || !endDate)) {
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
        { $set: { endDate } }
      );
      return res.json({
        status: 200,
        success: true,
        message: `${existingMaintenance.modifiedCount} records updated`,
      });
    } else if (maintenanceId) {
      // Edit existing record
      const existingMaintenance = await MaintenanceVehicle.findById(
        maintenanceId
      );

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

      return res.json({
        status: 200,
        success: true,
        message: "Maintenance schedule updated successfully",
      });
    } else {
      // Check for overlapping maintenance schedules
      const overlappingMaintenance = await MaintenanceVehicle.findOne({
        vehicleTableId: vehicleTableId,
        $or: [
          // Case 1: New schedule starts during an existing schedule
          {
            startDate: { $lte: startDate },
            endDate: { $gte: startDate },
          },
          // Case 2: New schedule ends during an existing schedule
          {
            startDate: { $lte: endDate },
            endDate: { $gte: endDate },
          },
          // Case 3: New schedule completely contains an existing schedule
          {
            startDate: { $gte: startDate },
            endDate: { $lte: endDate },
          },
        ],
      });

      if (overlappingMaintenance) {
        return res.json({
          status: 400,
          success: false,
          message:
            "Vehicle already has a maintenance schedule that overlaps with these dates and time",
        });
      }

      const vehicleData = await getVehicleTbl(req.query);

      const data = vehicleData?.data?.filter((item) => {
        return item._id.toString() === vehicleTableId;
      });

      if (data.length === 0) {
        const maintenanceData = {
          vehicleTableId,
          startDate,
          endDate,
          reason,
        };
        const newMaintenanceData = new MaintenanceVehicle(maintenanceData);
        await newMaintenanceData.save();

        return res.status(200).json({
          status: 200,
          success: true,
          message: "Vehicle successfully added to maintenance",
        });
      }

      return res.json({
        status: 404,
        success: false,
        message: "Vehicle is not available",
      });
    }
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
