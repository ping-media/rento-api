const Booking = require('../../../db/schemas/onboarding/Vehicle.Bookrecode.schema')

//const dayjs = require('dayjs');

const convertDateFormat = (date) => {
  // Split the input date to extract day, month, and year
  const [day, month, year] = date.split('/');

  // Create a new Date object
  const formattedDate = new Date(`${year}-${month}-${day}`).toISOString().split('T')[0]; // Extract the YYYY-MM-DD format

  // Append "T10" to match the desired output
  return `${formattedDate}T10`;
};

async function VehicleBookrecode({ bookingId, BookingDateAndTime, userId }) {
  const obj = { status: 200, message: "data fetched successfully", data: [] };

  try {
    // Extract startTime, startDate, endTime, endDate from BookingDateAndTime
    const { startTime, startDate, endTime, endDate } = BookingDateAndTime;

    // Convert date formats for startDate and endDate
    const formattedStartDate = convertDateFormat(startDate);
    const formattedEndDate = convertDateFormat(endDate);

    // Prepare the booking object
    const bookingData = {
      bookingId,
      BookingDateAndTime: {
        ...BookingDateAndTime,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      },
      userId,
    };

    // Validate required fields
    if (
      bookingId &&
      BookingDateAndTime &&
      startTime &&
      endTime &&
      formattedStartDate &&
      formattedEndDate &&
      userId
    ) {
      const SaveBooking = new Booking(bookingData);
      await SaveBooking.save(); // Save the booking record to the database
      obj.message = "New booking saved successfully";
      obj.data = bookingData;
    } else {
      obj.status = 401;
      obj.message = "Something is missing";
      return obj;
    }
  } catch (error) {
    console.error("Error saving booking record:", error);
    obj.status = 500;
    obj.message = "Internal server error";
  }

  return obj;
}




const getVehicleBookrecode = async (query) => {
    const obj = { status: 200, message: "Data fetched successfully", data: [] };
    try {
      const bookings = await Booking.find(); // Fetch bookings from DB
      if(!bookings){
        obj.message = "No Records Found"
        return obj
      }
  
      obj.message = "Data Fetched Successfully"
      obj.data = bookings
    } catch (error) {
      console.error("Error fetching bookings:", error);
      obj.message = "error"
    }
  
    return obj
  };
  

module.exports={VehicleBookrecode, getVehicleBookrecode}