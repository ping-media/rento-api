const { getVehicleTblData } = require("../models/vehicles.model");
const Booking = require("../../../db/schemas/onboarding/booking.schema")

const extentBooking = async (req, res) => {
    const { vehicleTableId, BookingStartDateAndTime, BookingEndDateAndTime, _id, extendAmount,bookingPrice, oldBookings,extendBooking } = req.body;


    // Validate input
    try {
        // const bookings = await Booking.findOne({_id:_id})

        // const {bookingPrice}=

        const vehicleData = await getVehicleTblData(req.query);


        const data = vehicleData?.data?.find((item) => {
            return item._id.toString() === vehicleTableId; 
        });
       
        bookingPrice = bookingPrice.extendAmount.push(extendAmount)
        extendBooking=extendBooking.oldBooking.push(oldBookings)
        const o = {
            BookingStartDateAndTime,
            BookingEndDateAndTime,
            extendBooking,
            bookingPrice
           
        }

        if (data) {

            const updatedData = await Booking.findOneAndUpdate(
                { _id: _id }, // Filter condition
                { $set: o },  // Update data
                { new: true } // Return the updated document
              );

            return res.status(200).json({
                status: 200,
                message: "booking extened ",
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
