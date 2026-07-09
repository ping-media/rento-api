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

//           // Base booking price (with discount if applicable)
//           basePrice: {
//             $cond: [
//               { $gt: ["$bookingPrice.discountTotalPrice", 0] },
//               "$bookingPrice.discountTotalPrice",
//               "$bookingPrice.totalPrice",
//             ],
//           },

//           // ✅ FIXED: Calculate extend amount with ALL components (amount + addOnAmount + tax + addonTax)
//           extendPaidSum: {
//             $sum: {
//               $map: {
//                 input: {
//                   $filter: {
//                     input: { $ifNull: ["$bookingPrice.extendAmount", []] },
//                     as: "item",
//                     cond: { $eq: ["$$item.status", "paid"] },
//                   },
//                 },
//                 as: "item",
//                 in: {
//                   $add: [
//                     { $ifNull: ["$$item.amount", 0] },
//                     { $ifNull: ["$$item.addOnAmount", 0] },
//                     { $ifNull: ["$$item.tax", 0] },
//                     { $ifNull: ["$$item.addonTax", 0] },
//                   ],
//                 },
//               },
//             },
//           },

//           // Vehicle change difference amount
//           diffPaidSum: {
//             $sum: {
//               $map: {
//                 input: {
//                   $filter: {
//                     input: { $ifNull: ["$bookingPrice.diffAmount", []] },
//                     as: "item",
//                     cond: { $eq: ["$$item.status", "paid"] },
//                   },
//                 },
//                 as: "item",
//                 in: { $ifNull: ["$$item.amount", 0] },
//               },
//             },
//           },

//           // ✅ Late fees (only if payment method is not "NA")
//           lateFeeSum: {
//             $cond: [
//               {
//                 $and: [
//                   { $ne: ["$bookingPrice.lateFeePaymentMethod", "NA"] },
//                   { $ne: ["$bookingPrice.lateFeePaymentMethod", null] },
//                 ],
//               },
//               {
//                 $add: [
//                   { $ifNull: ["$bookingPrice.lateFeeBasedOnHour", 0] },
//                   { $ifNull: ["$bookingPrice.lateFeeBasedOnKM", 0] },
//                 ],
//               },
//               0,
//             ],
//           },

//           // ✅ Additional fees (only if payment method is not "NA")
//           additionalFeeSum: {
//             $cond: [
//               {
//                 $and: [
//                   { $ne: ["$bookingPrice.additionFeePaymentMethod", "NA"] },
//                   { $ne: ["$bookingPrice.additionFeePaymentMethod", null] },
//                 ],
//               },
//               { $ifNull: ["$bookingPrice.additionalPrice", 0] },
//               0,
//             ],
//           },

//           // ✅ FIXED: Total price including ALL revenue components
//           price: {
//             $add: [
//               // Base price
//               {
//                 $cond: [
//                   { $gt: ["$bookingPrice.discountTotalPrice", 0] },
//                   "$bookingPrice.discountTotalPrice",
//                   "$bookingPrice.totalPrice",
//                 ],
//               },
//               // Extend amount (with addons and taxes)
//               {
//                 $sum: {
//                   $map: {
//                     input: {
//                       $filter: {
//                         input: { $ifNull: ["$bookingPrice.extendAmount", []] },
//                         as: "item",
//                         cond: { $eq: ["$$item.status", "paid"] },
//                       },
//                     },
//                     as: "item",
//                     in: {
//                       $add: [
//                         { $ifNull: ["$$item.amount", 0] },
//                         { $ifNull: ["$$item.addOnAmount", 0] },
//                         { $ifNull: ["$$item.tax", 0] },
//                         { $ifNull: ["$$item.addonTax", 0] },
//                       ],
//                     },
//                   },
//                 },
//               },
//               // Vehicle change difference
//               {
//                 $sum: {
//                   $map: {
//                     input: {
//                       $filter: {
//                         input: { $ifNull: ["$bookingPrice.diffAmount", []] },
//                         as: "item",
//                         cond: { $eq: ["$$item.status", "paid"] },
//                       },
//                     },
//                     as: "item",
//                     in: { $ifNull: ["$$item.amount", 0] },
//                   },
//                 },
//               },
//               // Late fees
//               {
//                 $cond: [
//                   {
//                     $and: [
//                       { $ne: ["$bookingPrice.lateFeePaymentMethod", "NA"] },
//                       { $ne: ["$bookingPrice.lateFeePaymentMethod", null] },
//                     ],
//                   },
//                   {
//                     $add: [
//                       { $ifNull: ["$bookingPrice.lateFeeBasedOnHour", 0] },
//                       { $ifNull: ["$bookingPrice.lateFeeBasedOnKM", 0] },
//                     ],
//                   },
//                   0,
//                 ],
//               },
//               // Additional fees
//               {
//                 $cond: [
//                   {
//                     $and: [
//                       { $ne: ["$bookingPrice.additionFeePaymentMethod", "NA"] },
//                       { $ne: ["$bookingPrice.additionFeePaymentMethod", null] },
//                     ],
//                   },
//                   { $ifNull: ["$bookingPrice.additionalPrice", 0] },
//                   0,
//                 ],
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
    const filter = {};
    if (stationId) filter.stationId = stationId;

    let dateRange = null;

    if (monthYear) {
      const parts = monthYear.split(" ");
      if (parts.length === 2) {
        const monthName = parts[0];
        const yearNum = parseInt(parts[1]);

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
          dateRange = {
            start: new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0)),
            end: new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0)), // exclusive
          };
        }
      }
    }

    // Same fix as the dashboard: pull in bookings created THIS month,
    // OR extended THIS month, OR vehicle-changed(diff) THIS month —
    // even if the booking itself was created in an earlier month.
    if (dateRange) {
      filter.$or = [
        { createdAt: { $gte: dateRange.start, $lt: dateRange.end } },
        {
          "bookingPrice.extendAmount": {
            $elemMatch: {
              status: "paid",
              paymentDate: { $gte: dateRange.start, $lt: dateRange.end },
            },
          },
        },
        {
          "bookingPrice.diffAmount": {
            $elemMatch: {
              status: "paid",
              paymentInitiatedDate: {
                $gte: dateRange.start.getTime(),
                $lt: dateRange.end.getTime(),
              },
            },
          },
        },
      ];
    }

    filter.bookingStatus = { $ne: "canceled" };

    const bookings = await Booking.find(filter);

    const dayMap = {}; // { "2026-07-01": { totalPrice, bookingCount } }

    const toDayKey = (date) => new Date(date).toISOString().slice(0, 10);

    const addToDay = (dayKey, price, isNewBooking) => {
      if (!dayMap[dayKey]) dayMap[dayKey] = { totalPrice: 0, bookingCount: 0 };
      dayMap[dayKey].totalPrice += price;
      if (isNewBooking) dayMap[dayKey].bookingCount += 1;
    };

    bookings.forEach((item) => {
      const bp = item.bookingPrice;

      const createdInRange =
        !dateRange ||
        (item.createdAt >= dateRange.start && item.createdAt < dateRange.end);

      // ─── BASE PRICE + LATE FEE + ADDITIONAL FEE → bucketed on the booking's createdAt day
      if (createdInRange) {
        const basePrice =
          bp.discountTotalPrice && bp.discountTotalPrice > 0
            ? Number(bp.discountTotalPrice) || 0
            : Number(bp.totalPrice) || 0;

        const lateFeeTotal =
          bp.lateFeePaymentMethod && bp.lateFeePaymentMethod !== "NA"
            ? (Number(bp.lateFeeBasedOnHour) || 0) +
              (Number(bp.lateFeeBasedOnKM) || 0)
            : 0;

        const additionalFeeTotal =
          bp.additionFeePaymentMethod && bp.additionFeePaymentMethod !== "NA"
            ? Number(bp.additionalPrice) || 0
            : 0;

        addToDay(
          toDayKey(item.createdAt),
          basePrice + lateFeeTotal + additionalFeeTotal,
          true,
        );
      }

      // ─── EXTEND AMOUNT → bucketed on the day it was actually PAID, not createdAt.
      // Old records with no paymentDate are skipped (same reasoning as the dashboard fix).
      if (Array.isArray(bp.extendAmount)) {
        bp.extendAmount.forEach((extend) => {
          if (extend.status !== "paid" || !extend.paymentDate) return;

          const paidDate = new Date(extend.paymentDate);
          const inRange =
            !dateRange ||
            (paidDate >= dateRange.start && paidDate < dateRange.end);
          if (!inRange) return;

          const extendSum =
            (Number(extend.amount) || 0) +
            (Number(extend.addOnAmount) || 0) +
            (Number(extend.tax) || 0) +
            (Number(extend.addonTax) || 0);

          addToDay(toDayKey(paidDate), extendSum, false);
        });
      }

      // ─── DIFF AMOUNT (vehicle change) → bucketed on the day it was actually paid
      if (Array.isArray(bp.diffAmount)) {
        bp.diffAmount.forEach((diff) => {
          if (diff.status !== "paid" || !diff.paymentInitiatedDate) return;

          const paidDate = new Date(diff.paymentInitiatedDate);
          const inRange =
            !dateRange ||
            (paidDate >= dateRange.start && paidDate < dateRange.end);
          if (!inRange) return;

          addToDay(toDayKey(paidDate), Number(diff.amount) || 0, false);
        });
      }
    });

    const graphData = Object.keys(dayMap)
      .sort()
      .map((day) => ({
        _id: day,
        totalPrice: dayMap[day].totalPrice,
        bookingCount: dayMap[day].bookingCount,
      }));

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
