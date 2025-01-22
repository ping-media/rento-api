const { getVehicleTblData } = require("../models/vehicles.model");
const Booking = require("../../../db/schemas/onboarding/booking.schema");

const extentBooking = async (req, res) => {
  const {
    vehicleTableId,
    BookingStartDateAndTime,
    BookingEndDateAndTime,
    _id,
    extendAmount,
    bookingPrice,
    oldBookings,
    extendBooking
  } = req.body;

  try {
    // Fetch vehicle data
    const vehicleData = await getVehicleTblData(req.query);

    // Find the specific vehicle in the data
    const data = vehicleData?.data?.find((item) => item._id.toString() === vehicleTableId);

    // Check if vehicle is valid and exists
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Vehicle is not available",
        data: null,
      });
    }

    // Update bookingPrice and extendBooking
    if (!bookingPrice.extendAmount) {
      bookingPrice.extendAmount = [];
    }
    bookingPrice.extendAmount.push(extendAmount);

    if (!extendBooking.oldBooking) {
      extendBooking.oldBooking = [];
    }
    extendBooking.oldBooking.push(oldBookings);

    // Prepare the updated data
    const updatedFields = {
      BookingStartDateAndTime,
      BookingEndDateAndTime,
      extendBooking,
      bookingPrice,
    };

    // Update booking in the database
    const updatedData = await Booking.findOneAndUpdate(
      { _id }, // Filter condition
      { $set: updatedFields }, // Update data
      { new: true } // Return the updated document
    );

    if (!updatedData) {
      return res.status(404).json({
        status: 404,
        message: "Booking not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Booking extended successfully",
      data: updatedData,
    });
  } catch (error) {
    console.error("Error during vehicle availability check:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

module.exports = { extentBooking };
