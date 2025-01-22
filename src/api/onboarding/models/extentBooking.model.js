const {getVehicleTblData}=require("../models/vehicles.model");
const Booking = require ("../../../db/schemas/onboarding/booking.schema")

const extentBooking = async (req, res) => {
  const { vehicleTableId, BookingStartDateAndTime, BookingEndDateAndTime, _id, extenedBooking, bookingPrice  } = req.body;
  

  // Validate input
  try{

   const vehicleData = await getVehicleTblData(req.query);
  // console.log(vehicleData)

   const data = vehicleData.data.find((item)=>{item.vehicleTableId===vehicleTableId});

   const o = {  BookingStartDateAndTime, BookingEndDateAndTime, extenedBooking, bookingPrice}

  if(data){
   
    const updatedData = await Booking.findOneAndUpdate(
        { _id: _id }, // Filter condition
        { $set: o },  // Update data
        { new: true } // Return the updated document
      );

      return res.status(200).json({
        status: 200,
        message: "booking extened ",
        data:updatedData
      });
  }
 
   return res.json({
    status: 401,
    message: "vehicle is not available",
    data:data
  });

  } catch (error) {
    console.error("Error during vehicle availability check:", error);
    return res.json({
      status: 500,
      message: "Internal server error",
    });
  }
};

module.exports = { extentBooking };
