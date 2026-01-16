const Booking = require("../../../db/schemas/onboarding/booking.schema");

// async function getBookingGraphData(req, res) {
//   const { stationId, monthYear } = req.query;

//   try {
//     const matchFilter = {};

//     if (stationId) matchFilter.stationId = stationId;

//     if (monthYear) {
//       const parts = monthYear.split(" ");

//       if (parts.length === 2) {
//         const monthName = parts[0];
//         const yearNum = parseInt(parts[1]);

//         // Map month names to their numerical values
//         const monthMap = {
//           january: 1,
//           february: 2,
//           march: 3,
//           april: 4,
//           may: 5,
//           june: 6,
//           july: 7,
//           august: 8,
//           september: 9,
//           october: 10,
//           november: 11,
//           december: 12,
//         };

//         const monthNum = monthMap[monthName.toLowerCase()];

//         if (monthNum && !isNaN(yearNum)) {
//           matchFilter.$expr = {
//             $and: [
//               { $eq: [{ $month: "$createdAt" }, monthNum] },
//               { $eq: [{ $year: "$createdAt" }, yearNum] },
//             ],
//           };
//         }
//       }
//     }

//     // MongoDB aggregation to group bookings by day
//     const graphData = await Booking.aggregate([
//       {
//         $match: {
//           ...matchFilter,
//           bookingStatus: { $ne: "canceled" },
//         },
//       },
//       {
//         $project: {
//           day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },

//           basePrice: {
//             $cond: [
//               { $gt: ["$bookingPrice.discountTotalPrice", 0] },
//               "$bookingPrice.discountTotalPrice",
//               "$bookingPrice.totalPrice",
//             ],
//           },

//           extendPaidSum: {
//             $sum: {
//               $map: {
//                 input: {
//                   $filter: {
//                     input: "$bookingPrice.extendPrice",
//                     as: "item",
//                     cond: { $eq: ["$$item.status", "paid"] },
//                   },
//                 },
//                 as: "item",
//                 in: "$$item.amount",
//               },
//             },
//           },

//           diffPaidSum: {
//             $sum: {
//               $map: {
//                 input: {
//                   $filter: {
//                     input: "$bookingPrice.diffAmount",
//                     as: "item",
//                     cond: { $eq: ["$$item.status", "paid"] },
//                   },
//                 },
//                 as: "item",
//                 in: "$$item.amount",
//               },
//             },
//           },

//           price: {
//             $add: [
//               {
//                 $cond: [
//                   { $gt: ["$bookingPrice.discountTotalPrice", 0] },
//                   "$bookingPrice.discountTotalPrice",
//                   "$bookingPrice.totalPrice",
//                 ],
//               },
//               {
//                 $sum: {
//                   $map: {
//                     input: {
//                       $filter: {
//                         input: "$bookingPrice.extendPrice",
//                         as: "item",
//                         cond: { $eq: ["$$item.status", "paid"] },
//                       },
//                     },
//                     as: "item",
//                     in: "$$item.amount",
//                   },
//                 },
//               },
//               {
//                 $sum: {
//                   $map: {
//                     input: {
//                       $filter: {
//                         input: "$bookingPrice.diffAmount",
//                         as: "item",
//                         cond: { $eq: ["$$item.status", "paid"] },
//                       },
//                     },
//                     as: "item",
//                     in: "$$item.amount",
//                   },
//                 },
//               },
//             ],
//           },
//         },
//       },
//       {
//         $group: {
//           _id: "$day",
//           totalPrice: { $sum: "$price" },
//           bookingCount: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { _id: 1 },
//       },
//     ]);

//     return res.json({
//       status: 200,
//       message: "Graph data fetched successfully",
//       data: graphData,
//     });
//   } catch (error) {
//     return res.json({
//       status: 500,
//       message: "An error occurred",
//       error: error.message,
//     });
//   }
// }

async function getBookingGraphData(req, res) {
  const { stationId, monthYear } = req.query;

  try {
    const matchFilter = {};

    if (stationId) matchFilter.stationId = stationId;

    if (monthYear) {
      const parts = monthYear.split(" ");

      if (parts.length === 2) {
        const monthName = parts[0];
        const yearNum = parseInt(parts[1]);

        // Map month names to their numerical values
        const monthMap = {
          january: 1,
          february: 2,
          march: 3,
          april: 4,
          may: 5,
          june: 6,
          july: 7,
          august: 8,
          september: 9,
          october: 10,
          november: 11,
          december: 12,
        };

        const monthNum = monthMap[monthName.toLowerCase()];

        if (monthNum && !isNaN(yearNum)) {
          matchFilter.$expr = {
            $and: [
              { $eq: [{ $month: "$createdAt" }, monthNum] },
              { $eq: [{ $year: "$createdAt" }, yearNum] },
            ],
          };
        }
      }
    }

    // MongoDB aggregation to group bookings by day
    const graphData = await Booking.aggregate([
      {
        $match: {
          ...matchFilter,
          bookingStatus: { $ne: "canceled" },
        },
      },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },

          // Base booking price (with discount if applicable)
          basePrice: {
            $cond: [
              { $gt: ["$bookingPrice.discountTotalPrice", 0] },
              "$bookingPrice.discountTotalPrice",
              "$bookingPrice.totalPrice",
            ],
          },

          // ✅ FIXED: Calculate extend amount with ALL components (amount + addOnAmount + tax + addonTax)
          extendPaidSum: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ["$bookingPrice.extendAmount", []] },
                    as: "item",
                    cond: { $eq: ["$$item.status", "paid"] },
                  },
                },
                as: "item",
                in: {
                  $add: [
                    { $ifNull: ["$$item.amount", 0] },
                    { $ifNull: ["$$item.addOnAmount", 0] },
                    { $ifNull: ["$$item.tax", 0] },
                    { $ifNull: ["$$item.addonTax", 0] },
                  ],
                },
              },
            },
          },

          // Vehicle change difference amount
          diffPaidSum: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ["$bookingPrice.diffAmount", []] },
                    as: "item",
                    cond: { $eq: ["$$item.status", "paid"] },
                  },
                },
                as: "item",
                in: { $ifNull: ["$$item.amount", 0] },
              },
            },
          },

          // ✅ Late fees (only if payment method is not "NA")
          lateFeeSum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$bookingPrice.lateFeePaymentMethod", "NA"] },
                  { $ne: ["$bookingPrice.lateFeePaymentMethod", null] },
                ],
              },
              {
                $add: [
                  { $ifNull: ["$bookingPrice.lateFeeBasedOnHour", 0] },
                  { $ifNull: ["$bookingPrice.lateFeeBasedOnKM", 0] },
                ],
              },
              0,
            ],
          },

          // ✅ Additional fees (only if payment method is not "NA")
          additionalFeeSum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$bookingPrice.additionFeePaymentMethod", "NA"] },
                  { $ne: ["$bookingPrice.additionFeePaymentMethod", null] },
                ],
              },
              { $ifNull: ["$bookingPrice.additionalPrice", 0] },
              0,
            ],
          },

          // ✅ FIXED: Total price including ALL revenue components
          price: {
            $add: [
              // Base price
              {
                $cond: [
                  { $gt: ["$bookingPrice.discountTotalPrice", 0] },
                  "$bookingPrice.discountTotalPrice",
                  "$bookingPrice.totalPrice",
                ],
              },
              // Extend amount (with addons and taxes)
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: { $ifNull: ["$bookingPrice.extendAmount", []] },
                        as: "item",
                        cond: { $eq: ["$$item.status", "paid"] },
                      },
                    },
                    as: "item",
                    in: {
                      $add: [
                        { $ifNull: ["$$item.amount", 0] },
                        { $ifNull: ["$$item.addOnAmount", 0] },
                        { $ifNull: ["$$item.tax", 0] },
                        { $ifNull: ["$$item.addonTax", 0] },
                      ],
                    },
                  },
                },
              },
              // Vehicle change difference
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: { $ifNull: ["$bookingPrice.diffAmount", []] },
                        as: "item",
                        cond: { $eq: ["$$item.status", "paid"] },
                      },
                    },
                    as: "item",
                    in: { $ifNull: ["$$item.amount", 0] },
                  },
                },
              },
              // Late fees
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$bookingPrice.lateFeePaymentMethod", "NA"] },
                      { $ne: ["$bookingPrice.lateFeePaymentMethod", null] },
                    ],
                  },
                  {
                    $add: [
                      { $ifNull: ["$bookingPrice.lateFeeBasedOnHour", 0] },
                      { $ifNull: ["$bookingPrice.lateFeeBasedOnKM", 0] },
                    ],
                  },
                  0,
                ],
              },
              // Additional fees
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$bookingPrice.additionFeePaymentMethod", "NA"] },
                      { $ne: ["$bookingPrice.additionFeePaymentMethod", null] },
                    ],
                  },
                  { $ifNull: ["$bookingPrice.additionalPrice", 0] },
                  0,
                ],
              },
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
      {
        $sort: { _id: 1 },
      },
    ]);

    return res.json({
      status: 200,
      message: "Graph data fetched successfully",
      data: graphData,
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: "An error occurred",
      error: error.message,
    });
  }
}

module.exports = { getBookingGraphData };
