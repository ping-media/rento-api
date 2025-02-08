const { getVehicleTbl } = require("../models/vehicles.model");
const Booking = require("../../../db/schemas/onboarding/booking.schema");
const vehicleTable = require("../../../db/schemas/onboarding/vehicle-table.schema");
const {whatsappMessage}=require("../../../utils/whatsappMessage")

const extentBooking = async (req, res) => {
    let {  _id, extendAmount,bookingPrice, oldBookings,extendBooking,bookingStatus } = req.body;
  //  const res = { status: 200, message: "Data fetched successfully", data: [] };
  const {vehicleTableId,BookingEndDateAndTime,BookingStartDateAndTime}=req.query



    try {
       

        const vehicleData = await getVehicleTbl(req.query);
        

        const data = vehicleData?.data?.filter((item) => {
            return item._id.toString() === vehicleTableId; 
        });
        // console.log(data)
       
        if (!bookingPrice.extendAmount) {
            bookingPrice.extendAmount = [];
          }
          bookingPrice.extendAmount.push(extendAmount);
      
          if (!extendBooking.oldBooking) {
            extendBooking.oldBooking = [];
          }
          extendBooking.oldBooking.push(oldBookings);
        const o = {
            BookingEndDateAndTime,
            extendBooking,
            bookingPrice,
            bookingStatus
        }

        if (data) {

            const updatedData = await Booking.findOneAndUpdate(
                { _id: _id }, // Filter condition
                { $set: o },  // Update data
                { new: true } // Return the updated document
              );

              const Amount=oldBookings.extendAmount[oldBookings.extendAmount.length-1].amount

              const messageData=[
                firstName,
                data.vehicleName,
                updatedData.bookingId,
                BookingStartDateAndTime,
                BookingEndDateAndTime,
                Amount,
                Amount,
                managerContact

              ]
              whatsappMessage(contact,"booking_extend",messageData)
            return res.status(200).json({
                status: 200,
                message: "booking extended successfully ",
                data: updatedData
            });
        }

        return res.json({
            status: 401,
            message: "vehicle is not available",
            data: data
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
