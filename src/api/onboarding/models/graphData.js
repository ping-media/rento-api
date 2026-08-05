const Booking = require("../../../db/schemas/onboarding/booking.schema");

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

    if (dateRange) {
      filter.$and = [
        { ...(stationId ? { stationId } : {}) },
        {
          $or: [
            {
              $or: [
                {
                  paymentInitiatedDate: {
                    $gte: dateRange.start.getTime(),
                    $lt: dateRange.end.getTime(),
                  },
                },
                {
                  paymentInitiatedDate: {
                    $gte: Math.floor(dateRange.start.getTime() / 1000),
                    $lt: Math.floor(dateRange.end.getTime() / 1000),
                  },
                },
              ],
            },
            {
              "bookingPrice.extendAmount": {
                $elemMatch: {
                  status: "paid",
                  paymentDate: { $gte: dateRange.start, $lt: dateRange.end },
                },
              },
            },
            {
              "bookingPrice.extendAmount": {
                $elemMatch: {
                  status: "paid",
                  paymentSuccessDate: {
                    $gte: dateRange.start.getTime(),
                    $lt: dateRange.end.getTime(),
                  },
                },
              },
            },
            {
              "bookingPrice.extendAmount": {
                $elemMatch: {
                  status: "paid",
                  paymentInitiatedDate: {
                    $gte: dateRange.start.getTime(),
                    $lt: dateRange.end.getTime(),
                  },
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
          ],
        },
      ];
    }

    filter.bookingStatus = { $not: /cancel/i };

    const bookings = await Booking.find(filter);

    const dayMap = {}; // { "2026-07-01": { totalPrice, bookingCount } }

    // const toDayKey = (date) => new Date(date).toISOString().slice(0, 10);
    const toDayKey = (date) => {
      const d = new Date(date);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(d.getTime() + istOffset);
      return istDate.toISOString().slice(0, 10);
    };

    const addToDay = (dayKey, price, isNewBooking) => {
      if (!dayMap[dayKey]) dayMap[dayKey] = { totalPrice: 0, bookingCount: 0 };
      dayMap[dayKey].totalPrice += price;
      if (isNewBooking) dayMap[dayKey].bookingCount += 1;
    };

    bookings.forEach((item) => {
      const bp = item.bookingPrice;

      const rawPaymentDate = item.paymentInitiatedDate || null;
      let paymentInitiatedDateMs = null;
      if (rawPaymentDate) {
        const ts = Number(rawPaymentDate);
        if (!isNaN(ts)) {
          paymentInitiatedDateMs = ts < 1e12 ? ts * 1000 : ts;
        }
      }

      const paidInRange =
        !dateRange ||
        (paymentInitiatedDateMs &&
          paymentInitiatedDateMs >= dateRange.start.getTime() &&
          paymentInitiatedDateMs < dateRange.end.getTime());

      // ─── BASE PRICE + LATE FEE + ADDITIONAL FEE → bucketed on the booking's createdAt day
      if (paidInRange) {
        const payInitFrom = item.payInitFrom || "";
        const paySuccessId = item.paySuccessId || "";
        const rideStatus = item.rideStatus || "";

        const isPaymentVerified =
          payInitFrom?.toLowerCase() === "cash"
            ? ["ongoing", "completed"].includes(rideStatus?.toLowerCase())
            : paySuccessId !== "" && paySuccessId?.toLowerCase() !== "na";

        if (isPaymentVerified) {
          const fullPrice =
            bp.isDiscountZero === true ||
            (bp.discountTotalPrice && bp.discountTotalPrice > 0)
              ? Number(bp.discountTotalPrice) || 0
              : Number(bp.totalPrice) || 0;

          let basePrice = 0;
          if (item.paymentStatus === "paid") {
            basePrice = fullPrice;
          } else if (
            item.paymentStatus === "partiallyPay" ||
            item.paymentStatus === "partially_paid"
          ) {
            basePrice =
              bp.AmountLeftAfterUserPaid?.status === "paid"
                ? fullPrice
                : Number(bp.userPaid) || 0;
          }

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
            toDayKey(new Date(paymentInitiatedDateMs)),
            basePrice + lateFeeTotal + additionalFeeTotal,
            true,
          );
        }
      }

      // ─── EXTEND AMOUNT → bucketed on the day it was actually PAID, not createdAt.
      // Old records with no paymentDate are skipped (same reasoning as the dashboard fix).
      if (Array.isArray(bp.extendAmount)) {
        bp.extendAmount.forEach((extend) => {
          if (extend.status !== "paid") return;

          const paidDate = extend.paymentDate
            ? new Date(extend.paymentDate)
            : extend.paymentSuccessDate
              ? new Date(extend.paymentSuccessDate)
              : extend.paymentInitiatedDate
                ? new Date(extend.paymentInitiatedDate)
                : null;

          if (!paidDate) return;
          const inRange =
            !dateRange ||
            (paidDate >= dateRange.start && paidDate < dateRange.end);
          if (!inRange) return;

          const extendSum =
            (Number(extend.amount) || 0) +
            // (Number(extend.addOnAmount) || 0) +
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

          // addToDay(toDayKey(paidDate), Number(diff.amount) || 0, false);
          const diffNet =
            (Number(diff.amount) || 0) - (Number(diff.refundAmount) || 0);
          addToDay(toDayKey(paidDate), diffNet, false);
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

async function getGraphDayDetail(req, res) {
  const { stationId, date, startDate, endDate } = req.query;

  if (!date && !startDate)
    return res.json({ status: 400, message: "date or startDate is required" });

  try {
    // const dayStart = startDate
    //   ? new Date(startDate + "T00:00:00.000Z")
    //   : new Date(date + "T00:00:00.000Z");
    // const dayEnd = endDate
    //   ? new Date(endDate + "T23:59:59.999Z")
    //   : new Date(date + "T23:59:59.999Z");

    // Use IST midnight (UTC+5:30 = subtract 5:30 from midnight IST to get UTC equivalent)
    const toISTDayStart = (dateStr) =>
      new Date(dateStr + "T00:00:00.000+05:30");
    const toISTDayEnd = (dateStr) => new Date(dateStr + "T23:59:59.999+05:30");

    const dayStart = startDate ? toISTDayStart(startDate) : toISTDayStart(date);
    const dayEnd = endDate ? toISTDayEnd(endDate) : toISTDayEnd(date);

    const filter = {};
    if (stationId) filter.stationId = stationId;

    filter.$and = [
      { ...(stationId ? { stationId } : {}) },
      {
        // $or: [
        //   {
        //     paymentInitiatedDate: {
        //       $gte: dayStart.getTime(),
        //       $lt: dayEnd.getTime(),
        //     },
        //   },
        //   {
        //     paymentInitiatedDate: {
        //       $gte: Math.floor(dayStart.getTime() / 1000),
        //       $lt: Math.floor(dayEnd.getTime() / 1000),
        //     },
        //   },
        $or: [
          { createdAt: { $gte: dayStart, $lt: dayEnd } },
          {
            "bookingPrice.extendAmount": {
              $elemMatch: {
                status: "paid",
                paymentDate: { $gte: dayStart, $lt: dayEnd },
              },
            },
          },
          {
            "bookingPrice.extendAmount": {
              $elemMatch: {
                status: "paid",
                paymentSuccessDate: {
                  $gte: dayStart.getTime(),
                  $lt: dayEnd.getTime(),
                },
              },
            },
          },
          {
            "bookingPrice.extendAmount": {
              $elemMatch: {
                status: "paid",
                paymentInitiatedDate: {
                  $gte: dayStart.getTime(),
                  $lt: dayEnd.getTime(),
                },
              },
            },
          },
          {
            "bookingPrice.diffAmount": {
              $elemMatch: {
                status: "paid",
                paymentInitiatedDate: {
                  $gte: dayStart.getTime(),
                  $lt: dayEnd.getTime(),
                },
              },
            },
          },
        ],
      },
    ];

    filter.bookingStatus = { $not: /cancel/i };

    const bookings = await Booking.find(filter).populate(
      "userId",
      "firstName lastName contact email",
    );

    const breakdown = [];

    bookings.forEach((item) => {
      const bp = item.bookingPrice;

      // base booking
      const createdInRange =
        item.createdAt >= dayStart && item.createdAt < dayEnd;

      if (createdInRange) {
        const payInitFrom = item.payInitFrom || "";
        const paySuccessId = item.paySuccessId || "";
        const rideStatus = item.rideStatus || "";

        const isPaymentVerified =
          payInitFrom?.toLowerCase() === "cash"
            ? ["ongoing", "completed"].includes(rideStatus?.toLowerCase())
            : paySuccessId !== "" && paySuccessId?.toLowerCase() !== "na";

        if (isPaymentVerified) {
          const fullPrice =
            bp.isDiscountZero === true ||
            (bp.discountTotalPrice && bp.discountTotalPrice > 0)
              ? Number(bp.discountTotalPrice) || 0
              : Number(bp.totalPrice) || 0;

          let amount = 0;
          if (item.paymentStatus === "paid") {
            amount = fullPrice;
          } else if (
            item.paymentStatus === "partiallyPay" ||
            item.paymentStatus === "partially_paid"
          ) {
            amount =
              bp.AmountLeftAfterUserPaid?.status === "paid"
                ? fullPrice
                : Number(bp.userPaid) || 0;
          }

          const lateFeeTotal =
            bp.lateFeePaymentMethod && bp.lateFeePaymentMethod !== "NA"
              ? (Number(bp.lateFeeBasedOnHour) || 0) +
                (Number(bp.lateFeeBasedOnKM) || 0)
              : 0;

          const additionalFeeTotal =
            bp.additionFeePaymentMethod && bp.additionFeePaymentMethod !== "NA"
              ? Number(bp.additionalPrice) || 0
              : 0;

          const totalAmount = amount + lateFeeTotal + additionalFeeTotal;

          if (totalAmount > 0) {
            breakdown.push({
              type: "booking",
              bookingId: item.bookingId,
              amount: totalAmount,
              baseAmount: amount,
              lateFee: lateFeeTotal,
              additionalFee: additionalFeeTotal,
              paymentMethod: item.payInitFrom,
              paymentStatus: item.paymentStatus,
              paymentDate: item.createdAt,
              paymentDateFormatted: new Date(item.createdAt).toLocaleDateString(
                "en-GB",
                { day: "2-digit", month: "short", year: "numeric" },
              ),
              customer: item.userId,
            });
          }
        }
      }

      // extensions
      if (Array.isArray(bp.extendAmount)) {
        bp.extendAmount.forEach((extend) => {
          if (extend.status !== "paid") return;

          const extendDateRaw = extend.paymentDate
            ? new Date(extend.paymentDate)
            : extend.paymentSuccessDate
              ? new Date(extend.paymentSuccessDate)
              : extend.paymentInitiatedDate
                ? new Date(extend.paymentInitiatedDate)
                : null;

          if (!extendDateRaw) return;

          const inRange = extendDateRaw >= dayStart && extendDateRaw < dayEnd;
          if (!inRange) return;

          breakdown.push({
            type: "extension",
            bookingId: `${item.bookingId}_ext_${extend.id}`,
            booking_id: item._id,
            amount:
              (Number(extend.amount) || 0) +
              (Number(extend.tax) || 0) +
              (Number(extend.addonTax) || 0),
            paymentMethod: extend.paymentMethod || "online",
            paymentStatus: extend.status,
            paymentDate: extendDateRaw,
            paymentDateFormatted: new Date(extendDateRaw).toLocaleDateString(
              "en-GB",
              { day: "2-digit", month: "short", year: "numeric" },
            ),
            customer: item.userId,
          });
        });
      }

      // diff
      if (Array.isArray(bp.diffAmount)) {
        bp.diffAmount.forEach((diff) => {
          if (diff.status !== "paid" || !diff.paymentInitiatedDate) return;

          const paidDate = new Date(diff.paymentInitiatedDate);
          const inRange = paidDate >= dayStart && paidDate < dayEnd;
          if (!inRange) return;

          breakdown.push({
            type: "vehicleChange",
            bookingId: `${item.bookingId}_chan_${diff.id}`,
            booking_id: item._id,
            // amount: Number(diff.amount) || 0,
            amount:
              (Number(diff.amount) || 0) - (Number(diff.refundAmount) || 0),
            paymentMethod: diff.paymentMethod || "online",
            paymentStatus: diff.status,
            paymentDate: paidDate,
            paymentDateFormatted: new Date(paidDate).toLocaleDateString(
              "en-GB",
              { day: "2-digit", month: "short", year: "numeric" },
            ),
            customer: item.userId,
          });
        });
      }
    });

    // sort by payment time desc
    breakdown.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    const total = breakdown.reduce((sum, b) => sum + b.amount, 0);

    return res.json({
      status: 200,
      message: "Day detail fetched successfully",
      data: {
        date,
        total,
        count: breakdown.length,
        breakdown,
      },
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: "An error occurred",
      error: error.message,
    });
  }
}

// async function getBookingGraphData(req, res) {
//   const { stationId, monthYear } = req.query;

//   try {
//     const filter = {};
//     if (stationId) filter.stationId = stationId;

//     let dateRange = null;

//     if (monthYear) {
//       const parts = monthYear.split(" ");
//       if (parts.length === 2) {
//         const monthName = parts[0];
//         const yearNum = parseInt(parts[1]);

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
//           dateRange = {
//             start: new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0)),
//             end: new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0)), // exclusive
//           };
//         }
//       }
//     }

//     // Same fix as the dashboard: pull in bookings created THIS month,
//     // OR extended THIS month, OR vehicle-changed(diff) THIS month —
//     // even if the booking itself was created in an earlier month.
//     if (dateRange) {
//       filter.$or = [
//         { createdAt: { $gte: dateRange.start, $lt: dateRange.end } },
//         {
//           "bookingPrice.extendAmount": {
//             $elemMatch: {
//               status: "paid",
//               paymentDate: { $gte: dateRange.start, $lt: dateRange.end },
//             },
//           },
//         },
//         {
//           "bookingPrice.diffAmount": {
//             $elemMatch: {
//               status: "paid",
//               paymentInitiatedDate: {
//                 $gte: dateRange.start.getTime(),
//                 $lt: dateRange.end.getTime(),
//               },
//             },
//           },
//         },
//       ];
//     }

//     filter.bookingStatus = { $ne: "canceled" };

//     const bookings = await Booking.find(filter);

//     const dayMap = {}; // { "2026-07-01": { totalPrice, bookingCount } }

//     const toDayKey = (date) => new Date(date).toISOString().slice(0, 10);

//     const addToDay = (dayKey, price, isNewBooking) => {
//       if (!dayMap[dayKey]) dayMap[dayKey] = { totalPrice: 0, bookingCount: 0 };
//       dayMap[dayKey].totalPrice += price;
//       if (isNewBooking) dayMap[dayKey].bookingCount += 1;
//     };

//     bookings.forEach((item) => {
//       const bp = item.bookingPrice;

//       const createdInRange =
//         !dateRange ||
//         (item.createdAt >= dateRange.start && item.createdAt < dateRange.end);

//       // ─── BASE PRICE + LATE FEE + ADDITIONAL FEE → bucketed on the booking's createdAt day
//       if (createdInRange) {
//         const basePrice =
//           bp.discountTotalPrice && bp.discountTotalPrice > 0
//             ? Number(bp.discountTotalPrice) || 0
//             : Number(bp.totalPrice) || 0;

//         const lateFeeTotal =
//           bp.lateFeePaymentMethod && bp.lateFeePaymentMethod !== "NA"
//             ? (Number(bp.lateFeeBasedOnHour) || 0) +
//               (Number(bp.lateFeeBasedOnKM) || 0)
//             : 0;

//         const additionalFeeTotal =
//           bp.additionFeePaymentMethod && bp.additionFeePaymentMethod !== "NA"
//             ? Number(bp.additionalPrice) || 0
//             : 0;

//         addToDay(
//           toDayKey(item.createdAt),
//           basePrice + lateFeeTotal + additionalFeeTotal,
//           true,
//         );
//       }

//       // ─── EXTEND AMOUNT → bucketed on the day it was actually PAID, not createdAt.
//       // Old records with no paymentDate are skipped (same reasoning as the dashboard fix).
//       if (Array.isArray(bp.extendAmount)) {
//         bp.extendAmount.forEach((extend) => {
//           if (extend.status !== "paid" || !extend.paymentDate) return;

//           const paidDate = new Date(extend.paymentDate);
//           const inRange =
//             !dateRange ||
//             (paidDate >= dateRange.start && paidDate < dateRange.end);
//           if (!inRange) return;

//           const extendSum =
//             (Number(extend.amount) || 0) +
//             (Number(extend.addOnAmount) || 0) +
//             (Number(extend.tax) || 0) +
//             (Number(extend.addonTax) || 0);

//           addToDay(toDayKey(paidDate), extendSum, false);
//         });
//       }

//       // ─── DIFF AMOUNT (vehicle change) → bucketed on the day it was actually paid
//       if (Array.isArray(bp.diffAmount)) {
//         bp.diffAmount.forEach((diff) => {
//           if (diff.status !== "paid" || !diff.paymentInitiatedDate) return;

//           const paidDate = new Date(diff.paymentInitiatedDate);
//           const inRange =
//             !dateRange ||
//             (paidDate >= dateRange.start && paidDate < dateRange.end);
//           if (!inRange) return;

//           addToDay(toDayKey(paidDate), Number(diff.amount) || 0, false);
//         });
//       }
//     });

//     const graphData = Object.keys(dayMap)
//       .sort()
//       .map((day) => ({
//         _id: day,
//         totalPrice: dayMap[day].totalPrice,
//         bookingCount: dayMap[day].bookingCount,
//       }));

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

module.exports = { getBookingGraphData, getGraphDayDetail };
