const MaintenanceVehicle = require("../../../db/schemas/onboarding/maintenanceVehicleSchema");
const { getVehicleTbl } = require("../models/vehicles.model");

// const maintenanceVehicleFunction = async (req, res) => {
//   const { vehicleTableId, startDate, endDate } = req.body;

//   // Validate input
//   if (!vehicleTableId || !startDate || !endDate) {
//     return res.json({
//       status: 400,
//       message: "Missing required fields: vehicleTableId, startDate, or endDate",
//     });
//   }

//   try {
//     if (!startDate || !endDate) {
//       return res.json({
//         status: 400,
//         message: "Maintenance start and end dates are required.",
//         data: [],
//       });
//     }

//     // Function to validate ISO8601 date format
//     function isValidISO8601(dateString) {
//       const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

//       // Check if the format matches the ISO 8601 pattern
//       if (!iso8601Regex.test(dateString)) {
//         return false;
//       }

//       // Check if it's a valid date
//       const date = new Date(dateString);
//       return !isNaN(date.getTime());
//     }

//     const startDateValidation = isValidISO8601(startDate);
//     const endDateValidation = isValidISO8601(endDate);

//     if (!startDateValidation || !endDateValidation) {
//       return res.json({
//         status: 400,
//         message: "Invalid date format",
//         data: [],
//       });
//     }

//     const vehicleData = await getVehicleTbl(req.query);

//     const data = vehicleData?.data?.filter((item) => {
//       return item._id.toString() === vehicleTableId;
//     });
//     // console.log(data);
//     // return;
//     if (data.length === 0) {
//       //Proceed with adding the vehicle to maintenance if no conflicts
//       const maintenanceData = { vehicleTableId, startDate, endDate };

//       // Save the maintenance data
//       const newMaintenanceData = new MaintenanceVehicle(maintenanceData);
//       await newMaintenanceData.save();

//       return res.status(200).json({
//         status: 200,
//         message: "Vehicle successfully added to maintenance",
//       });
//     }

//     return res.json({
//       status: 404,
//       message: "Vehicle is not available",
//     });
//   } catch (error) {
//     console.error("Error during maintenance vehicle process:", error);
//     return res.json({
//       status: 500,
//       message: "Internal server error",
//     });
//   }
// };

const maintenanceVehicleFunction = async (req, res) => {
  const { vehicleTableId, startDate, endDate, maintenanceId } = req.body;

  // Validate input for new records
  if (!vehicleTableId || !startDate || !endDate) {
    return res.json({
      status: 400,
      message: "Missing required fields: vehicleTableId, startDate, or endDate",
    });
  }

  try {
    // Function to validate ISO8601 date format
    function isValidISO8601(dateString) {
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

      // Check if the format matches the ISO 8601 pattern
      if (!iso8601Regex.test(dateString)) {
        return false;
      }

      // Check if it's a valid date
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    }

    const startDateValidation = isValidISO8601(startDate);
    const endDateValidation = isValidISO8601(endDate);

    if (!startDateValidation || !endDateValidation) {
      return res.json({
        status: 400,
        message: "Invalid date format",
        data: [],
      });
    }

    // Check if this is an edit operation (maintenanceId is provided)
    if (maintenanceId) {
      // Find the existing maintenance record
      const existingMaintenance = await MaintenanceVehicle.findById(
        maintenanceId
      );

      if (!existingMaintenance) {
        return res.json({
          status: 404,
          message: "Maintenance record not found",
        });
      }

      // Update the maintenance record
      existingMaintenance.vehicleTableId = vehicleTableId;
      existingMaintenance.startDate = startDate;
      existingMaintenance.endDate = endDate;

      await existingMaintenance.save();

      return res.json({
        status: 200,
        message: "Maintenance schedule updated successfully",
      });
    } else {
      // This is a new maintenance record
      const vehicleData = await getVehicleTbl(req.query);

      const data = vehicleData?.data?.filter((item) => {
        return item._id.toString() === vehicleTableId;
      });

      if (data.length === 0) {
        // Proceed with adding the vehicle to maintenance if no conflicts
        const maintenanceData = { vehicleTableId, startDate, endDate };

        // Save the maintenance data
        const newMaintenanceData = new MaintenanceVehicle(maintenanceData);
        await newMaintenanceData.save();

        return res.status(200).json({
          status: 200,
          message: "Vehicle successfully added to maintenance",
        });
      }

      return res.json({
        status: 404,
        message: "Vehicle is not available",
      });
    }
  } catch (error) {
    console.error("Error during maintenance vehicle process:", error);
    return res.json({
      status: 500,
      message: "Internal server error",
    });
  }
};

const getMaintenanceVehicle = async (req, res) => {
  try {
    const { vehicleTableId } = req.query;
    let query = {};

    if (vehicleTableId) {
      query.vehicleTableId = vehicleTableId;
    }

    const maintenanceData = await MaintenanceVehicle.find(query).sort({
      createdAt: -1,
    });

    return res.json({
      status: 200,
      success: true,
      message: "Maintenance data retrieved successfully",
      data: maintenanceData,
      count: maintenanceData.length,
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

module.exports = { maintenanceVehicleFunction, getMaintenanceVehicle };
