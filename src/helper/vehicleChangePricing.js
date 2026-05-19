const { getVehicleTbl } = require("../api/onboarding/models/vehicles.model");
const vehicleTable = require("../db/schemas/onboarding/vehicle-table.schema");

const calculateVehicleChangePricing = async (
  booking,
  newVehicleTableId,
  isAdmin = false,
) => {
  const now = new Date();
  const paidExtensions =
    booking.bookingPrice.extendAmount?.filter((e) => e.status === "paid") || [];

  // --- Determine current segment ---
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

  //   use that new vehicle's cost as the baseline
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
      // snapshot is vehicle-only cost → addon not included → add separately
      addonAlreadyInOldCost = false;
    }
  } else {
    // bookingPrice.totalPrice already includes addon → don't add again
    addonAlreadyInOldCost = true;
  }

  const segmentStart = new Date(currentSegment.startDate);
  const segmentEnd = new Date(currentSegment.endDate);
  const segmentDays = Math.ceil(
    (segmentEnd - segmentStart) / (1000 * 60 * 60 * 24),
  );
  const rawDaysLeft = (segmentEnd - now) / (1000 * 60 * 60 * 24);
  let daysLeft = Math.min(
    Math.ceil(rawDaysLeft), // rounds up remaining time
    segmentDays, // but never more than total segment
  );
  // const daysLeft = Math.ceil((segmentEnd - now) / (1000 * 60 * 60 * 24));

  const totalBookingDuration = Math.ceil(
    (new Date(booking.BookingEndDateAndTime) -
      new Date(booking.BookingStartDateAndTime)) /
      (1000 * 60 * 60 * 24),
  );

  if (daysLeft <= 0) {
    if (!isAdmin) {
      // only block non-admins
      return {
        success: false,
        message: "No remaining days left in the booking.",
      };
    }

    daysLeft = 0;
  }

  // --- Fetch new vehicle with pricing for this segment ---
  const newVehicleRaw = await vehicleTable
    .findById(newVehicleTableId)
    // .populate("vehicleMasterId")
    .lean();

  if (!newVehicleRaw) {
    return { success: false, message: "New vehicle not found." };
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
    // admin: allow but will be flagged in response
  }

  // --- Calculate difference ---
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
  // const newRemainingCost =
  //   (newVehicleFullPrice / segmentDays) * daysLeft + addonProrated;

  // const priceDifference = newRemainingCost - oldRemainingValue;

  // const isExtraPayment = priceDifference > 1;
  // const isRefund = priceDifference < -1;
  // const isFreeSwap = !isExtraPayment && !isRefund;

  const rawPriceDifference = newRemainingCost - oldRemainingValue;

  // --- Check what user has actually paid ---
  const userPaid = Number(booking.bookingPrice.userPaid || 0);
  const discountTotalPrice = Number(
    booking.bookingPrice.discountTotalPrice || 0,
  );
  const totalPrice = Number(booking.bookingPrice.totalPrice || 0);
  const paymentStatus = booking.paymentStatus;

  // Determine effective paid amount
  let effectivePaid = 0;
  if (userPaid > 0) {
    effectivePaid = userPaid;
  } else if (paymentStatus === "paid") {
    effectivePaid = discountTotalPrice > 0 ? discountTotalPrice : totalPrice;
  }

  let priceDifference;
  let isExtraPayment = false;
  let isRefund = false;
  let isFreeSwap = false;
  let pendingPayment = 0; // amount user still needs to pay

  if (effectivePaid === 0) {
    // Nothing paid yet — no refund possible, just recalculate what they owe
    // new vehicle costs less or same → they just owe newRemainingCost
    // new vehicle costs more → they owe newRemainingCost
    priceDifference = Math.round(Math.abs(rawPriceDifference));
    pendingPayment = Math.round(newRemainingCost);
    isExtraPayment = false;
    isRefund = false;
    isFreeSwap = true; // no payment action needed yet since nothing was paid
  } else {
    // Something was paid — check against new cost
    const amountStillOwed = Math.round(newRemainingCost) - effectivePaid;

    if (amountStillOwed > 1) {
      // User paid less than new vehicle cost → they need to pay more
      priceDifference = amountStillOwed;
      pendingPayment = amountStillOwed;
      isExtraPayment = true;
      isRefund = false;
    } else if (amountStillOwed < -1) {
      // User overpaid compared to new vehicle cost → refund the difference
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
    isVehicleConflicted: newVehiclePriced.bookingConflict !== null,
    conflictingBookingId: newVehiclePriced.bookingConflict?.bookingId || null,
    // segment info
    currentSegment,
    segmentDays,
    daysLeft,
    totalBookingDuration,
    // pricing
    oldRemainingValue: Math.round(oldRemainingValue),
    newRemainingCost: Math.round(newRemainingCost),
    priceDifference,
    pendingPayment,
    effectivePaid,
    isExtraPayment,
    isRefund,
    isFreeSwap,
    // priceDifference: Math.round(Math.abs(priceDifference)),
    // isExtraPayment,
    // isRefund,
    // isFreeSwap,
    // new vehicle full data with pricing
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
    // newVehicleData: {
    //   _id: newVehicleRaw._id,
    //   vehicleMasterId:
    //     newVehicleRaw.vehicleMasterId?._id || newVehicleRaw.vehicleMasterId,
    //   vehicleNumber: newVehicleRaw.vehicleNumber,
    //   vehicleName: newVehicleRaw.vehicleMasterId?.vehicleName,
    //   vehicleBrand: newVehicleRaw.vehicleMasterId?.vehicleBrand,
    //   vehicleImage: newVehicleRaw.vehicleMasterId?.vehicleImage,
    //   vehiclePlan: newVehicleRaw.vehiclePlan,
    //   perDayCost: newVehicleRaw.perDayCost,
    //   totalRentalCost: newVehiclePriced.totalRentalCost,
    //   appliedPlans: newVehiclePriced.appliedPlans,
    //   _daysBreakdown: newVehiclePriced._daysBreakdown,
    //   tax: newVehiclePriced.tax || 0,
    // },
  };
};

module.exports = { calculateVehicleChangePricing };
