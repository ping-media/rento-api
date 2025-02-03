const MaintenanceVehicle = require ("../../../db/schemas/onboarding/maintenanceVehicleSchema");
const Booking = require('../../../db/schemas/onboarding/maintenanceVehicleSchema');
const vehicleTable = require('../../../db/schemas/onboarding/vehicle-table.schema');
const { mongoose } = require("mongoose");
const {getVehicleTbl}= require("../models/vehicles.model")


// const maintenanceVehicleFunction=async(req,res)=>{
//     const {vehicleTableId, startDate, endDate}=req.body;
//     if(!vehicleTableId || !startDate || !endDate){
//         return res.json({
//             status: 400,
//             message: "Missing required fields: vehicleTableId, startDate, or endDate"
//         });
//     }
//     try {

       
//             if (!startDate && !endDate ){
//                 return res.json ({
//                 status: 400,
//                 message: "maintenance start and end dates are required.",
//                 data: [],
//               });
//             }
          
      
      
//           function isValidISO8601(dateString) {
//             const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
          
//             // Check if the format matches the ISO 8601 pattern
//             if (!iso8601Regex.test(dateString)) {
//               return false;
//             }
          
//             // Check if it's a valid date
//             const date = new Date(dateString);
//             return !isNaN(date.getTime());
//           }
      
//           const startDateValidation = isValidISO8601(startDate);
//         const endDateValidation = isValidISO8601(endDate);
       
//       //console.log(startDateValidation,endDateValidation)
//         if (!startDateValidation || !endDateValidation) {
//           return {
//             status: 400,
//             message: "Invalid date format",
//             data: [],
//           };
//         }

//         const ObjDta = { vehicleTableId, startDate, endDate };

//         // Save the log to the database
//         const newData = new MaintenanceVehicle(ObjDta);
//         await newData.save();

        

//         return res.status(200).json({
//             status: 200,
//             message: "Vehicle add successfully in maintenance",
           
//         });
        
//     } catch (error) {
//         console.error("Error during KYC approval:", error);
//         return res.json({
//             status: 500,
//             message: "Internal server error"
//         });
//     }
// }




const maintenanceVehicleFunction = async (req, res) => {
    const { vehicleTableId, startDate, endDate } = req.body;
  
    // Validate input
    if (!vehicleTableId || !startDate || !endDate) {
      return res.json({
        status: 400,
        message: "Missing required fields: vehicleTableId, startDate, or endDate"
      });
    }
  
    try {
      if (!startDate || !endDate) {
        return res.json({
          status: 400,
          message: "Maintenance start and end dates are required.",
          data: [],
        });
      }
  
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
  
      

    //   const pipeline = [      
    //     // Lookup bookings for the vehicle
    //     {
    //         $lookup: {
    //             from: "bookings",
    //             localField: "_id",
    //             foreignField: "vehicleTableId",
    //             as: "bookings",
    //         },
    //     },
    //     // Lookup station data
    //     {
    //         $lookup: {
    //             from: "stations",
    //             localField: "stationId",
    //             foreignField: "stationId",
    //             as: "stationData",
    //         },
    //     },
    //     // Lookup vehicle master data
    //     {
    //         $lookup: {
    //             from: "vehiclemasters",
    //             localField: "vehicleMasterId",
    //             foreignField: "_id",
    //             as: "vehicleMasterData",
    //         },
    //     },
    //     // Lookup maintenance records
    //     {
    //         $lookup: {
    //             from: "maintenancevehicles",
    //             localField: "_id",
    //             foreignField: "vehicleTableId",
    //             as: "maintenanceData",
    //         },
    //     },
    
    //     // Filter conflicting bookings & maintenance
    //     {
    //         $addFields: {
    //             conflictingBookings: {
    //                 $filter: {
    //                     input: "$bookings",
    //                     as: "booking",
    //                     cond: {
    //                         $and: [
    //                             { $ne: ["$$booking.bookingStatus", "pending"] }, // Exclude pending bookings
    //                             {
    //                                 $or: [
    //                                     {
    //                                         $and: [
    //                                             { $gte: ["$$booking.BookingStartDateAndTime", startDate] },
    //                                             { $lte: ["$$booking.BookingStartDateAndTime", endDate] },
    //                                         ],
    //                                     },
    //                                     {
    //                                         $and: [
    //                                             { $gte: ["$$booking.BookingEndDateAndTime", startDate] },
    //                                             { $lte: ["$$booking.BookingEndDateAndTime", endDate] },
    //                                         ],
    //                                     },
    //                                     {
    //                                         $and: [
    //                                             { $lte: ["$$booking.BookingStartDateAndTime", startDate] },
    //                                             { $gte: ["$$booking.BookingEndDateAndTime", endDate] },
    //                                         ],
    //                                     },
    //                                 ],
    //                             },
    //                         ],
    //                     },
    //                 },
    //             },
    //             conflictingMaintenance: {
    //                 $filter: {
    //                     input: "$maintenanceData",
    //                     as: "maintenance",
    //                     cond: {
    //                         $and: [
    //                             { $lte: ["$$maintenance.startDate", endDate] },
    //                             { $gte: ["$$maintenance.endDate", startDate] },
    //                         ],
    //                     },
    //                 },
    //             },
    //         },
    //     },
    
    //     // Flatten vehicle master and station data
    //     {
    //         $addFields: {
    //             vehicleMasterData: { $arrayElemAt: ["$vehicleMasterData", 0] },
    //             stationData: { $arrayElemAt: ["$stationData", 0] },
    //         },
    //     },
    
    //     // Project the required fields
    //     {
    //         $project: {
    //             _id: 1,
    //             vehicleMasterData: 1,
    //             stationData: 1,
    //             conflictingBookings: 1,
    //             conflictingMaintenance: 1,
    //         },
    //     },
    // ];
    

     
     const vehicleData =await getVehicleTbl(req.query)
     console.log(vehicleData)

      const data = vehicleData?.data?.filter((item) => {
        return item._id.toString() === vehicleTableId; 
    });
   // console.log(data)
    if(data.length){
    //Proceed with adding the vehicle to maintenance if no conflicts
      const maintenanceData = { vehicleTableId, startDate, endDate };
  
      // Save the maintenance data
      const newMaintenanceData = new MaintenanceVehicle(maintenanceData);
      await newMaintenanceData.save();
  
      return res.status(200).json({
        status: 200,
        message: "Vehicle successfully added to maintenance",
      });
  
     
    }
      
   // Proceed with adding the vehicle to maintenance if no conflicts
      // const maintenanceData = { vehicleTableId, startDate, endDate };
  
      // // Save the maintenance data
      // const newMaintenanceData = new MaintenanceVehicle(maintenanceData);
      // await newMaintenanceData.save();
  
      return res.json({
        status: 200,
        message: "Vehicle is not available",
      });
    } catch (error) {
      console.error("Error during maintenance vehicle process:", error);
      return res.json({
        status: 500,
        message: "Internal server error",
      });
    }
  };
  




module.exports={maintenanceVehicleFunction}