const { getVehicleTbl } = require("../api/onboarding/models/vehicles.model");
const vehicleTable = require("../db/schemas/onboarding/vehicle-table.schema");

// old one
// const calculateVehicleChangePricing = async (
//   booking,
//   newVehicleTableId,
//   isAdmin = false,
// ) => {
//   const now = new Date();
//   const paidExtensions =
//     booking.bookingPrice.extendAmount?.filter((e) => e.status === "paid") || [];

//   // --- Determine current segment ---
//   let currentSegment = null;

//   for (let i = paidExtensions.length - 1; i >= 0; i--) {
//     const ext = paidExtensions[i];
//     const extStart = new Date(ext.BookingStartDateAndTime);

//     if (now >= extStart) {
//       currentSegment = {
//         type: "extension",
//         index: i,
//         startDate: ext.BookingStartDateAndTime,
//         endDate: ext.bookingEndDateAndTime || ext.BookingEndDateAndTime,
//         oldCost: Number(ext.amount || 0) + Number(ext.addOnAmount || 0),
//         appliedPlans: ext.appliedPlans || [],
//       };
//       break;
//     }
//   }

//   if (!currentSegment) {
//     const baseEndDate =
//       paidExtensions.length > 0
//         ? paidExtensions[0].originalBookingEndDateAndTime
//         : booking.BookingEndDateAndTime;

//     currentSegment = {
//       type: "base",
//       startDate: booking.BookingStartDateAndTime,
//       endDate: baseEndDate,
//       oldCost: booking.bookingPrice.totalPrice,
//       appliedPlans: booking.bookingPrice.appliedPlan || [],
//     };
//   }

//   //   use that new vehicle's cost as the baseline
//   const lastVehicleChange = booking.bookingPrice.diffAmount
//     ?.filter((d) => d.title === "changedVehicle" && d.newVehicleSnapshot)
//     ?.at(-1);

//   let addonAlreadyInOldCost = false;

//   if (lastVehicleChange?.newVehicleSnapshot) {
//     const lastSnapshot = lastVehicleChange.newVehicleSnapshot;
//     const lastNewVehicleCost =
//       Number(lastSnapshot.rentalCost || 0) + Number(lastSnapshot.tax || 0);

//     if (lastNewVehicleCost > 0) {
//       currentSegment.oldCost = lastNewVehicleCost;
//       // snapshot is vehicle-only cost → addon not included → add separately
//       addonAlreadyInOldCost = false;
//     }
//   } else {
//     // bookingPrice.totalPrice already includes addon → don't add again
//     addonAlreadyInOldCost = true;
//   }

//   const segmentStart = new Date(currentSegment.startDate);
//   const segmentEnd = new Date(currentSegment.endDate);
//   const segmentDays = Math.ceil(
//     (segmentEnd - segmentStart) / (1000 * 60 * 60 * 24),
//   );
//   const rawDaysLeft = (segmentEnd - now) / (1000 * 60 * 60 * 24);
//   let daysLeft = Math.min(
//     Math.ceil(rawDaysLeft), // rounds up remaining time
//     segmentDays, // but never more than total segment
//   );

//   const totalBookingDuration = Math.ceil(
//     (new Date(booking.BookingEndDateAndTime) -
//       new Date(booking.BookingStartDateAndTime)) /
//       (1000 * 60 * 60 * 24),
//   );

//   if (daysLeft <= 0) {
//     return {
//       success: false,
//       message:
//         "No remaining days left in this booking. Please extend the ride first before changing the vehicle.",
//     };
//   }
//   // if (daysLeft <= 0) {
//   //   if (!isAdmin) {
//   //     // only block non-admins
//   //     return {
//   //       success: false,
//   //       message: "No remaining days left in the booking.",
//   //     };
//   //   }

//   //   daysLeft = 0;
//   // }

//   // --- Fetch new vehicle with pricing for this segment ---
//   const newVehicleRaw = await vehicleTable.findById(newVehicleTableId).lean();

//   if (!newVehicleRaw) {
//     return { success: false, message: "New vehicle not found." };
//   }

//   const newVehiclePricing = await getVehicleTbl({
//     _id: newVehicleTableId,
//     BookingStartDateAndTime: currentSegment.startDate,
//     BookingEndDateAndTime: currentSegment.endDate,
//     excludeBookingId: booking._id.toString(),
//     includeUnavailable: true,
//   });

//   if (newVehiclePricing.status !== 200 || !newVehiclePricing.data?.length) {
//     return { success: false, message: "Unable to fetch new vehicle pricing." };
//   }

//   const newVehiclePriced = newVehiclePricing.data[0];

//   if (newVehiclePriced.bookingConflict !== null) {
//     if (!isAdmin) {
//       return {
//         success: false,
//         message: `Vehicle is already booked. Booking ID: ${newVehiclePriced.bookingConflict?.bookingId}`,
//       };
//     }
//     // admin: allow but will be flagged in response
//   }

//   // --- Calculate difference ---
//   const addonCost =
//     Number(booking.bookingPrice.extraAddonPrice || 0) +
//     Number(booking.bookingPrice.addonTax || 0);

//   const addonProrated = addonAlreadyInOldCost
//     ? 0
//     : (addonCost / totalBookingDuration) * daysLeft;

//   const oldRemainingValue =
//     (currentSegment.oldCost / segmentDays) * daysLeft + addonProrated;

//   const addonForNew = (addonCost / totalBookingDuration) * daysLeft;
//   const newVehicleFullPrice =
//     newVehiclePriced.totalRentalCost + Number(newVehiclePriced.tax || 0);

//   const newRemainingCost =
//     (newVehicleFullPrice / segmentDays) * daysLeft + addonForNew;

//   const rawPriceDifference = newRemainingCost - oldRemainingValue;

//   // --- Check what user has actually paid ---
//   const userPaid = Number(booking.bookingPrice.userPaid || 0);
//   const discountTotalPrice = Number(
//     booking.bookingPrice.discountTotalPrice || 0,
//   );
//   const AmountLeftAfterUserPaid =
//     booking.bookingPrice.AmountLeftAfterUserPaid ?? null;
//   const totalPrice = Number(booking.bookingPrice.totalPrice || 0);
//   const paymentStatus = booking.paymentStatus;

//   // Determine effective paid amount
//   let effectivePaid = 0;
//   if (userPaid > 0) {
//     effectivePaid = userPaid;
//     // If partial pay and remaining amount has also been collected, add it
//     if (AmountLeftAfterUserPaid && AmountLeftAfterUserPaid.status === "paid") {
//       effectivePaid += Number(AmountLeftAfterUserPaid.amount || 0);
//     }
//   } else if (paymentStatus === "paid") {
//     effectivePaid = discountTotalPrice > 0 ? discountTotalPrice : totalPrice;
//   }

//   let priceDifference;
//   let isExtraPayment = false;
//   let isRefund = false;
//   let isFreeSwap = false;
//   let isPendingOriginalPayment = false;
//   let pendingPayment = 0; // amount user still needs to pay

//   if (effectivePaid === 0) {
//     // Nothing paid yet — no refund possible, just recalculate what they owe
//     // new vehicle costs less or same → they just owe newRemainingCost
//     // new vehicle costs more → they owe newRemainingCost
//     priceDifference = Math.round(Math.abs(rawPriceDifference));
//     pendingPayment = Math.round(newRemainingCost);
//     isExtraPayment = false;
//     isRefund = false;
//     isFreeSwap = false; // no payment action needed yet since nothing was paid
//     isPendingOriginalPayment = true; // ← new flag: "change is free, but original balance is still outstanding"
//   } else {
//     // Something was paid — check against new cost
//     const amountStillOwed = Math.round(newRemainingCost) - effectivePaid;

//     if (amountStillOwed > 1) {
//       // User paid less than new vehicle cost → they need to pay more
//       priceDifference = amountStillOwed;
//       pendingPayment = amountStillOwed;
//       isExtraPayment = true;
//       isRefund = false;
//     } else if (amountStillOwed < -1) {
//       // User overpaid compared to new vehicle cost → refund the difference
//       priceDifference = Math.abs(amountStillOwed);
//       pendingPayment = 0;
//       isExtraPayment = false;
//       isRefund = true;
//     } else {
//       priceDifference = 0;
//       pendingPayment = 0;
//       isExtraPayment = false;
//       isRefund = false;
//       isFreeSwap = true;
//     }
//   }

//   return {
//     success: true,
//     isVehicleConflicted: newVehiclePriced.bookingConflict !== null,
//     conflictingBookingId: newVehiclePriced.bookingConflict?.bookingId || null,
//     // segment info
//     currentSegment,
//     segmentDays,
//     daysLeft,
//     totalBookingDuration,
//     // pricing
//     oldRemainingValue: Math.round(oldRemainingValue),
//     newRemainingCost: Math.round(newRemainingCost),
//     priceDifference,
//     pendingPayment,
//     effectivePaid,
//     isPendingOriginalPayment,
//     isExtraPayment,
//     isRefund,
//     isFreeSwap,
//     // new vehicle full data with pricing
//     newVehicleData: {
//       _id: newVehicleRaw._id,
//       vehicleMasterId: newVehicleRaw.vehicleMasterId,
//       vehicleNumber: newVehicleRaw.vehicleNumber,
//       vehicleName: newVehiclePriced?.vehicleMasterData?.vehicleName,
//       vehicleBrand: newVehiclePriced?.vehicleMasterData?.vehicleBrand,
//       vehicleImage: newVehiclePriced?.vehicleMasterData?.vehicleImage,
//       vehiclePlan: newVehicleRaw.vehiclePlan,
//       perDayCost: newVehicleRaw.perDayCost,
//       totalRentalCost: newVehiclePriced.totalRentalCost,
//       appliedPlans: newVehiclePriced.appliedPlans,
//       _daysBreakdown: newVehiclePriced._daysBreakdown,
//       tax: newVehiclePriced.tax || 0,
//     },
//   };
// };

// new one where directly swaping the vehicle if it lies under same model
const calculateVehicleChangePricing = async (
  booking,
  newVehicleTableId,
  isAdmin = false,
) => {
  const now = new Date();

  // --- Fetch new vehicle raw data first (needed for master ID check) ---
  const newVehicleRaw = await vehicleTable.findById(newVehicleTableId).lean();
  if (!newVehicleRaw) {
    return { success: false, message: "New vehicle not found." };
  }

  // --- Same model check ---
  const isSameMasterSwap =
    booking.vehicleMasterId.toString() ===
    newVehicleRaw.vehicleMasterId.toString();

  if (isSameMasterSwap) {
    // Same model = same price, just a unit swap — skip full recalculation
    // Still need vehicle details and conflict check
    const newVehiclePricing = await getVehicleTbl({
      _id: newVehicleTableId,
      BookingStartDateAndTime: booking.BookingStartDateAndTime,
      BookingEndDateAndTime: booking.BookingEndDateAndTime,
      excludeBookingId: booking._id.toString(),
      includeUnavailable: true,
    });

    if (newVehiclePricing.status !== 200 || !newVehiclePricing.data?.length) {
      return {
        success: false,
        message: "Unable to fetch new vehicle details.",
      };
    }

    const newVehiclePriced = newVehiclePricing.data[0];

    if (newVehiclePriced.bookingConflict !== null && !isAdmin) {
      return {
        success: false,
        message: `Vehicle is already booked. Booking ID: ${newVehiclePriced.bookingConflict?.bookingId}`,
      };
    }

    return {
      success: true,
      isSameMasterSwap: true,
      isVehicleConflicted: newVehiclePriced.bookingConflict !== null,
      conflictingBookingId: newVehiclePriced.bookingConflict?.bookingId || null,
      currentSegment: null,
      segmentDays: 0,
      daysLeft: 0,
      totalBookingDuration: 0,
      oldRemainingValue: 0,
      newRemainingCost: 0,
      priceDifference: 0,
      pendingPayment: 0,
      effectivePaid: 0,
      isPendingOriginalPayment: false,
      isExtraPayment: false,
      isRefund: false,
      isFreeSwap: true,
      newVehicleData: {
        _id: newVehicleRaw._id,
        vehicleMasterId: newVehicleRaw.vehicleMasterId,
        vehicleNumber: newVehicleRaw.vehicleNumber,
        vehicleName: newVehiclePriced?.vehicleMasterData?.vehicleName,
        vehicleBrand: newVehiclePriced?.vehicleMasterData?.vehicleBrand,
        vehicleImage: newVehiclePriced?.vehicleMasterData?.vehicleImage,
        vehiclePlan: newVehicleRaw.vehiclePlan,
        perDayCost: newVehicleRaw.perDayCost,
        totalRentalCost: 0,
        appliedPlans: [],
        _daysBreakdown: [],
        tax: 0,
      },
    };
  }

  // --- Different model — proceed with full recalculation ---
  const paidExtensions =
    booking.bookingPrice.extendAmount?.filter((e) => e.status === "paid") || [];

  let currentSegment = null;

  for (let i = paidExtensions.length - 1; i >= 0; i--) {
    const ext = paidExtensions[i];
    const extStart = new Date(ext.BookingStartDateAndTime);

    if (now >= extStart) {
      currentSegment = {
        type: "extension",
        index: i,
        startDate: ext.BookingStartDateAndTime,
        endDate: ext.bookingEndDateAndTime || ext.BookingEndDateAndTime,
        oldCost: Number(ext.amount || 0) + Number(ext.addOnAmount || 0),
        appliedPlans: ext.appliedPlans || [],
      };
      break;
    }
  }

  if (!currentSegment) {
    const baseEndDate =
      paidExtensions.length > 0
        ? paidExtensions[0].originalBookingEndDateAndTime
        : booking.BookingEndDateAndTime;

    currentSegment = {
      type: "base",
      startDate: booking.BookingStartDateAndTime,
      endDate: baseEndDate,
      oldCost: booking.bookingPrice.totalPrice,
      appliedPlans: booking.bookingPrice.appliedPlan || [],
    };
  }

  const lastVehicleChange = booking.bookingPrice.diffAmount
    ?.filter((d) => d.title === "changedVehicle" && d.newVehicleSnapshot)
    ?.at(-1);

  let addonAlreadyInOldCost = false;

  if (lastVehicleChange?.newVehicleSnapshot) {
    const lastSnapshot = lastVehicleChange.newVehicleSnapshot;
    const lastNewVehicleCost =
      Number(lastSnapshot.rentalCost || 0) + Number(lastSnapshot.tax || 0);

    if (lastNewVehicleCost > 0) {
      currentSegment.oldCost = lastNewVehicleCost;
      addonAlreadyInOldCost = false;
    }
  } else {
    addonAlreadyInOldCost = true;
  }

  const segmentStart = new Date(currentSegment.startDate);
  const segmentEnd = new Date(currentSegment.endDate);
  const segmentDays = Math.ceil(
    (segmentEnd - segmentStart) / (1000 * 60 * 60 * 24),
  );
  const rawDaysLeft = (segmentEnd - now) / (1000 * 60 * 60 * 24);
  let daysLeft = Math.min(Math.ceil(rawDaysLeft), segmentDays);

  const totalBookingDuration = Math.ceil(
    (new Date(booking.BookingEndDateAndTime) -
      new Date(booking.BookingStartDateAndTime)) /
      (1000 * 60 * 60 * 24),
  );

  if (daysLeft <= 0) {
    return {
      success: false,
      message:
        "No remaining days left in this booking. Please extend the ride first before changing the vehicle.",
    };
  }

  const newVehiclePricing = await getVehicleTbl({
    _id: newVehicleTableId,
    BookingStartDateAndTime: currentSegment.startDate,
    BookingEndDateAndTime: currentSegment.endDate,
    excludeBookingId: booking._id.toString(),
    includeUnavailable: true,
  });

  if (newVehiclePricing.status !== 200 || !newVehiclePricing.data?.length) {
    return { success: false, message: "Unable to fetch new vehicle pricing." };
  }

  const newVehiclePriced = newVehiclePricing.data[0];

  if (newVehiclePriced.bookingConflict !== null) {
    if (!isAdmin) {
      return {
        success: false,
        message: `Vehicle is already booked. Booking ID: ${newVehiclePriced.bookingConflict?.bookingId}`,
      };
    }
  }

  const addonCost =
    Number(booking.bookingPrice.extraAddonPrice || 0) +
    Number(booking.bookingPrice.addonTax || 0);

  const addonProrated = addonAlreadyInOldCost
    ? 0
    : (addonCost / totalBookingDuration) * daysLeft;

  const oldRemainingValue =
    (currentSegment.oldCost / segmentDays) * daysLeft + addonProrated;

  const addonForNew = (addonCost / totalBookingDuration) * daysLeft;
  const newVehicleFullPrice =
    newVehiclePriced.totalRentalCost + Number(newVehiclePriced.tax || 0);

  const newRemainingCost =
    (newVehicleFullPrice / segmentDays) * daysLeft + addonForNew;

  const rawPriceDifference = newRemainingCost - oldRemainingValue;

  const userPaid = Number(booking.bookingPrice.userPaid || 0);
  const discountTotalPrice = Number(
    booking.bookingPrice.discountTotalPrice || 0,
  );
  const AmountLeftAfterUserPaid =
    booking.bookingPrice.AmountLeftAfterUserPaid ?? null;
  const totalPrice = Number(booking.bookingPrice.totalPrice || 0);
  const paymentStatus = booking.paymentStatus;

  let effectivePaid = 0;
  if (userPaid > 0) {
    effectivePaid = userPaid;
    if (AmountLeftAfterUserPaid && AmountLeftAfterUserPaid.status === "paid") {
      effectivePaid += Number(AmountLeftAfterUserPaid.amount || 0);
    }
  } else if (paymentStatus === "paid") {
    effectivePaid = discountTotalPrice > 0 ? discountTotalPrice : totalPrice;
  }

  let priceDifference;
  let isExtraPayment = false;
  let isRefund = false;
  let isFreeSwap = false;
  let isPendingOriginalPayment = false;
  let pendingPayment = 0;

  if (effectivePaid === 0) {
    priceDifference = Math.round(Math.abs(rawPriceDifference));
    pendingPayment = Math.round(newRemainingCost);
    isExtraPayment = false;
    isRefund = false;
    isFreeSwap = false;
    isPendingOriginalPayment = true;
  } else {
    const amountStillOwed = Math.round(newRemainingCost) - effectivePaid;

    if (amountStillOwed > 1) {
      priceDifference = amountStillOwed;
      pendingPayment = amountStillOwed;
      isExtraPayment = true;
      isRefund = false;
    } else if (amountStillOwed < -1) {
      priceDifference = Math.abs(amountStillOwed);
      pendingPayment = 0;
      isExtraPayment = false;
      isRefund = true;
    } else {
      priceDifference = 0;
      pendingPayment = 0;
      isExtraPayment = false;
      isRefund = false;
      isFreeSwap = true;
    }
  }

  return {
    success: true,
    isSameMasterSwap: false,
    isVehicleConflicted: newVehiclePriced.bookingConflict !== null,
    conflictingBookingId: newVehiclePriced.bookingConflict?.bookingId || null,
    currentSegment,
    segmentDays,
    daysLeft,
    totalBookingDuration,
    oldRemainingValue: Math.round(oldRemainingValue),
    newRemainingCost: Math.round(newRemainingCost),
    priceDifference,
    pendingPayment,
    effectivePaid,
    isPendingOriginalPayment,
    isExtraPayment,
    isRefund,
    isFreeSwap,
    newVehicleData: {
      _id: newVehicleRaw._id,
      vehicleMasterId: newVehicleRaw.vehicleMasterId,
      vehicleNumber: newVehicleRaw.vehicleNumber,
      vehicleName: newVehiclePriced?.vehicleMasterData?.vehicleName,
      vehicleBrand: newVehiclePriced?.vehicleMasterData?.vehicleBrand,
      vehicleImage: newVehiclePriced?.vehicleMasterData?.vehicleImage,
      vehiclePlan: newVehicleRaw.vehiclePlan,
      perDayCost: newVehicleRaw.perDayCost,
      totalRentalCost: newVehiclePriced.totalRentalCost,
      appliedPlans: newVehiclePriced.appliedPlans,
      _daysBreakdown: newVehiclePriced._daysBreakdown,
      tax: newVehiclePriced.tax || 0,
    },
  };
};

// const calculateVehicleChangePricing = async (
//   booking,
//   newVehicleTableId,
//   isAdmin = false,
// ) => {
//   const now = new Date();

//   const newVehicleRaw = await vehicleTable.findById(newVehicleTableId).lean();
//   if (!newVehicleRaw) {
//     return { success: false, message: "New vehicle not found." };
//   }

//   const isSameMasterSwap =
//     booking.vehicleMasterId.toString() ===
//     newVehicleRaw.vehicleMasterId.toString();

//   if (isSameMasterSwap) {
//     const newVehiclePricing = await getVehicleTbl({
//       _id: newVehicleTableId,
//       BookingStartDateAndTime: booking.BookingStartDateAndTime,
//       BookingEndDateAndTime: booking.BookingEndDateAndTime,
//       excludeBookingId: booking._id.toString(),
//       includeUnavailable: true,
//     });

//     if (newVehiclePricing.status !== 200 || !newVehiclePricing.data?.length) {
//       return {
//         success: false,
//         message: "Unable to fetch new vehicle details.",
//       };
//     }

//     const newVehiclePriced = newVehiclePricing.data[0];

//     if (newVehiclePriced.bookingConflict !== null && !isAdmin) {
//       return {
//         success: false,
//         message: `Vehicle is already booked. Booking ID: ${newVehiclePriced.bookingConflict?.bookingId}`,
//       };
//     }

//     // Carry forward real cost for snapshot chain — never store zero
//     // Same model = same price, so carry from last non-same-model snapshot
//     // or original booking price
//     const lastRelevantSnapshot = booking.bookingPrice.diffAmount
//       ?.filter(
//         (d) =>
//           d.title === "changedVehicle" &&
//           d.newVehicleSnapshot &&
//           !d.isSameMasterSwap,
//       )
//       ?.at(-1);

//     const snapshotRentalCost = lastRelevantSnapshot
//       ? Number(lastRelevantSnapshot.newVehicleSnapshot.rentalCost || 0)
//       : Number(booking.bookingPrice.totalPrice || 0);

//     const snapshotTax = lastRelevantSnapshot
//       ? Number(lastRelevantSnapshot.newVehicleSnapshot.tax || 0)
//       : Number(booking.bookingPrice.tax || 0);

//     return {
//       success: true,
//       isSameMasterSwap: true,
//       isVehicleConflicted: newVehiclePriced.bookingConflict !== null,
//       conflictingBookingId: newVehiclePriced.bookingConflict?.bookingId || null,
//       currentSegment: null,
//       segmentDays: 0,
//       daysLeft: 0,
//       totalBookingDuration: 0,
//       oldRemainingValue: 0,
//       newRemainingCost: 0,
//       priceDifference: 0,
//       pendingPayment: 0,
//       effectivePaid: 0,
//       isPendingOriginalPayment: false,
//       isExtraPayment: false,
//       isRefund: false,
//       isFreeSwap: true,
//       newVehicleData: {
//         _id: newVehicleRaw._id,
//         vehicleMasterId: newVehicleRaw.vehicleMasterId,
//         vehicleNumber: newVehicleRaw.vehicleNumber,
//         vehicleName: newVehiclePriced?.vehicleMasterData?.vehicleName,
//         vehicleBrand: newVehiclePriced?.vehicleMasterData?.vehicleBrand,
//         vehicleImage: newVehiclePriced?.vehicleMasterData?.vehicleImage,
//         vehiclePlan: newVehicleRaw.vehiclePlan,
//         perDayCost: newVehicleRaw.perDayCost,
//         totalRentalCost: snapshotRentalCost,
//         appliedPlans: newVehiclePriced.appliedPlans || [],
//         _daysBreakdown: newVehiclePriced._daysBreakdown || [],
//         tax: snapshotTax,
//       },
//     };
//   }

//   // --- Different model — segment detection ---
//   const paidExtensions =
//     booking.bookingPrice.extendAmount?.filter((e) => e.status === "paid") || [];

//   let currentSegment = null;

//   for (let i = paidExtensions.length - 1; i >= 0; i--) {
//     const ext = paidExtensions[i];
//     const extStart = new Date(ext.BookingStartDateAndTime);

//     if (now >= extStart) {
//       currentSegment = {
//         type: "extension",
//         index: i,
//         startDate: ext.BookingStartDateAndTime,
//         endDate: ext.bookingEndDateAndTime || ext.BookingEndDateAndTime,
//         oldCost: Number(ext.amount || 0) + Number(ext.addOnAmount || 0),
//         appliedPlans: ext.appliedPlans || [],
//       };
//       break;
//     }
//   }

//   if (!currentSegment) {
//     const baseEndDate =
//       paidExtensions.length > 0
//         ? paidExtensions[0].originalBookingEndDateAndTime
//         : booking.BookingEndDateAndTime;

//     currentSegment = {
//       type: "base",
//       startDate: booking.BookingStartDateAndTime,
//       endDate: baseEndDate,
//       oldCost: booking.bookingPrice.totalPrice,
//       appliedPlans: booking.bookingPrice.appliedPlan || [],
//     };
//   }

//   const segmentStart = new Date(currentSegment.startDate);

//   // Only use a previous snapshot as baseline if:
//   // 1. It was a different-model swap (same-model swaps carry forward base cost, not segment cost)
//   // 2. It happened within the current segment (not from an earlier segment)
//   const lastRelevantVehicleChange = booking.bookingPrice.diffAmount
//     ?.filter((d) => {
//       if (d.title !== "changedVehicle" || !d.newVehicleSnapshot) return false;
//       if (d.isSameMasterSwap) return false;
//       const changeDate = new Date(d.paymentInitiatedDate);
//       return changeDate >= segmentStart;
//     })
//     ?.at(-1);

//   let addonAlreadyInOldCost = false;

//   if (lastRelevantVehicleChange?.newVehicleSnapshot) {
//     const lastSnapshot = lastRelevantVehicleChange.newVehicleSnapshot;
//     const lastNewVehicleCost =
//       Number(lastSnapshot.rentalCost || 0) + Number(lastSnapshot.tax || 0);

//     if (lastNewVehicleCost > 0) {
//       currentSegment.oldCost = lastNewVehicleCost;
//       addonAlreadyInOldCost = false;
//     }
//   } else {
//     addonAlreadyInOldCost = true;
//   }

//   const segmentEnd = new Date(currentSegment.endDate);
//   const segmentDays = Math.ceil(
//     (segmentEnd - segmentStart) / (1000 * 60 * 60 * 24),
//   );
//   const rawDaysLeft = (segmentEnd - now) / (1000 * 60 * 60 * 24);
//   let daysLeft = Math.min(Math.ceil(rawDaysLeft), segmentDays);

//   const totalBookingDuration = Math.ceil(
//     (new Date(booking.BookingEndDateAndTime) -
//       new Date(booking.BookingStartDateAndTime)) /
//       (1000 * 60 * 60 * 24),
//   );

//   // Fetch new vehicle pricing regardless of daysLeft
//   // daysLeft > 0 → full recalculation
//   // daysLeft <= 0 → free swap but we still need real cost for snapshot chain
//   const newVehiclePricing = await getVehicleTbl({
//     _id: newVehicleTableId,
//     BookingStartDateAndTime: currentSegment.startDate,
//     BookingEndDateAndTime: currentSegment.endDate,
//     excludeBookingId: booking._id.toString(),
//     includeUnavailable: true,
//   });

//   if (newVehiclePricing.status !== 200 || !newVehiclePricing.data?.length) {
//     return { success: false, message: "Unable to fetch new vehicle pricing." };
//   }

//   const newVehiclePriced = newVehiclePricing.data[0];

//   if (newVehiclePriced.bookingConflict !== null && !isAdmin) {
//     return {
//       success: false,
//       message: `Vehicle is already booked. Booking ID: ${newVehiclePriced.bookingConflict?.bookingId}`,
//     };
//   }

//   // No days left — period fully consumed, free swap for different model too
//   // Extension after this will price fresh at new vehicle's rate
//   if (daysLeft <= 0) {
//     return {
//       success: true,
//       isSameMasterSwap: false,
//       isVehicleConflicted: newVehiclePriced.bookingConflict !== null,
//       conflictingBookingId: newVehiclePriced.bookingConflict?.bookingId || null,
//       currentSegment,
//       segmentDays,
//       daysLeft: 0,
//       totalBookingDuration,
//       oldRemainingValue: 0,
//       newRemainingCost: 0,
//       priceDifference: 0,
//       pendingPayment: 0,
//       effectivePaid: 0,
//       isPendingOriginalPayment: false,
//       isExtraPayment: false,
//       isRefund: false,
//       isFreeSwap: true,
//       newVehicleData: {
//         _id: newVehicleRaw._id,
//         vehicleMasterId: newVehicleRaw.vehicleMasterId,
//         vehicleNumber: newVehicleRaw.vehicleNumber,
//         vehicleName: newVehiclePriced?.vehicleMasterData?.vehicleName,
//         vehicleBrand: newVehiclePriced?.vehicleMasterData?.vehicleBrand,
//         vehicleImage: newVehiclePriced?.vehicleMasterData?.vehicleImage,
//         vehiclePlan: newVehicleRaw.vehiclePlan,
//         perDayCost: newVehicleRaw.perDayCost,
//         totalRentalCost: newVehiclePriced.totalRentalCost,
//         appliedPlans: newVehiclePriced.appliedPlans,
//         _daysBreakdown: newVehiclePriced._daysBreakdown,
//         tax: newVehiclePriced.tax || 0,
//       },
//     };
//   }

//   // --- daysLeft > 0 — full recalculation ---
//   const addonCost =
//     Number(booking.bookingPrice.extraAddonPrice || 0) +
//     Number(booking.bookingPrice.addonTax || 0);

//   const addonProrated = addonAlreadyInOldCost
//     ? 0
//     : (addonCost / totalBookingDuration) * daysLeft;

//   const oldRemainingValue =
//     (currentSegment.oldCost / segmentDays) * daysLeft + addonProrated;

//   const addonForNew = (addonCost / totalBookingDuration) * daysLeft;
//   const newVehicleFullPrice =
//     newVehiclePriced.totalRentalCost + Number(newVehiclePriced.tax || 0);

//   const newRemainingCost =
//     (newVehicleFullPrice / segmentDays) * daysLeft + addonForNew;

//   const rawPriceDifference = newRemainingCost - oldRemainingValue;

//   const userPaid = Number(booking.bookingPrice.userPaid || 0);
//   const discountTotalPrice = Number(
//     booking.bookingPrice.discountTotalPrice || 0,
//   );
//   const AmountLeftAfterUserPaid =
//     booking.bookingPrice.AmountLeftAfterUserPaid ?? null;
//   const totalPrice = Number(booking.bookingPrice.totalPrice || 0);
//   const paymentStatus = booking.paymentStatus;

//   let effectivePaid = 0;
//   if (userPaid > 0) {
//     effectivePaid = userPaid;
//     if (AmountLeftAfterUserPaid && AmountLeftAfterUserPaid.status === "paid") {
//       effectivePaid += Number(AmountLeftAfterUserPaid.amount || 0);
//     }
//   } else if (paymentStatus === "paid") {
//     effectivePaid = discountTotalPrice > 0 ? discountTotalPrice : totalPrice;
//   }

//   let priceDifference;
//   let isExtraPayment = false;
//   let isRefund = false;
//   let isFreeSwap = false;
//   let isPendingOriginalPayment = false;
//   let pendingPayment = 0;

//   if (effectivePaid === 0) {
//     priceDifference = Math.round(Math.abs(rawPriceDifference));
//     pendingPayment = Math.round(newRemainingCost);
//     isExtraPayment = false;
//     isRefund = false;
//     isFreeSwap = false;
//     isPendingOriginalPayment = true;
//   } else {
//     const amountStillOwed = Math.round(newRemainingCost) - effectivePaid;

//     if (amountStillOwed > 1) {
//       priceDifference = amountStillOwed;
//       pendingPayment = amountStillOwed;
//       isExtraPayment = true;
//       isRefund = false;
//     } else if (amountStillOwed < -1) {
//       priceDifference = Math.abs(amountStillOwed);
//       pendingPayment = 0;
//       isExtraPayment = false;
//       isRefund = true;
//     } else {
//       priceDifference = 0;
//       pendingPayment = 0;
//       isExtraPayment = false;
//       isRefund = false;
//       isFreeSwap = true;
//     }
//   }

//   return {
//     success: true,
//     isSameMasterSwap: false,
//     isVehicleConflicted: newVehiclePriced.bookingConflict !== null,
//     conflictingBookingId: newVehiclePriced.bookingConflict?.bookingId || null,
//     currentSegment,
//     segmentDays,
//     daysLeft,
//     totalBookingDuration,
//     oldRemainingValue: Math.round(oldRemainingValue),
//     newRemainingCost: Math.round(newRemainingCost),
//     priceDifference,
//     pendingPayment,
//     effectivePaid,
//     isPendingOriginalPayment,
//     isExtraPayment,
//     isRefund,
//     isFreeSwap,
//     newVehicleData: {
//       _id: newVehicleRaw._id,
//       vehicleMasterId: newVehicleRaw.vehicleMasterId,
//       vehicleNumber: newVehicleRaw.vehicleNumber,
//       vehicleName: newVehiclePriced?.vehicleMasterData?.vehicleName,
//       vehicleBrand: newVehiclePriced?.vehicleMasterData?.vehicleBrand,
//       vehicleImage: newVehiclePriced?.vehicleMasterData?.vehicleImage,
//       vehiclePlan: newVehicleRaw.vehiclePlan,
//       perDayCost: newVehicleRaw.perDayCost,
//       totalRentalCost: newVehiclePriced.totalRentalCost,
//       appliedPlans: newVehiclePriced.appliedPlans,
//       _daysBreakdown: newVehiclePriced._daysBreakdown,
//       tax: newVehiclePriced.tax || 0,
//     },
//   };
// };

module.exports = { calculateVehicleChangePricing };
