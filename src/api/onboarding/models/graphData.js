const Booking = require('../../../db/schemas/onboarding/booking.schema')


async function getBookingGraphData(req,res) {
    try {
      // MongoDB aggregation to group bookings by day
      const graphData = await Booking.aggregate([
        {
          $project: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            price: {
              $cond: [
                { $gt: ["$bookingPrice.discountTotalPrice", 0] },
                "$bookingPrice.discountTotalPrice",
                "$bookingPrice.totalPrice",
              ],
            },
          },
        },
        {
          $group: {
            _id: "$day",
            totalPrice: { $sum: "$price" },
            bookingCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }, // Sort by day
      ]);
  

     // console.log(graphData)
      // Format the data for the graph
    //   const formattedData = graphData.map(item => ({
    //     date: item._id,
    //     totalPrice: item.totalPrice,
    //   }));
  
             return res.json(
      {
        status: 200,
        message: "Graph data fetched successfully",
        data: graphData,
      });
    } catch (error) {
        return res.json({ status: 500, message: "An error occurred", error: error.message });
    }
  }
  
  module.exports= {getBookingGraphData}