const { getVehicleTbl } = require("../api/onboarding/models/vehicles.model");
const vehicleTable = require("../db/schemas/onboarding/vehicle-table.schema");

const calculateVehicleChangePricing = async (booking, newVehicleTableId) => {
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
        endDate: ext.bookingEndDateAndTime,
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

  if (lastVehicleChange?.newVehicleSnapshot) {
    const lastSnapshot = lastVehicleChange.newVehicleSnapshot;
    const lastNewVehicleCost =
      Number(lastSnapshot.rentalCost || 0) + Number(lastSnapshot.tax || 0);

    if (lastNewVehicleCost > 0) {
      currentSegment.oldCost = lastNewVehicleCost;
    }
  }

  const segmentStart = new Date(currentSegment.startDate);
  const segmentEnd = new Date(currentSegment.endDate);
  const segmentDays = Math.ceil(
    (segmentEnd - segmentStart) / (1000 * 60 * 60 * 24),
  );
  const daysLeft = Math.ceil((segmentEnd - now) / (1000 * 60 * 60 * 24));

  const totalBookingDuration = Math.ceil(
    (new Date(booking.BookingEndDateAndTime) -
      new Date(booking.BookingStartDateAndTime)) /
      (1000 * 60 * 60 * 24),
  );

  if (daysLeft <= 0) {
    return {
      success: false,
      message: "No remaining days left in the booking.",
    };
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

  // ADD THESE:
  //   console.log("=== vehicleChangePricing debug ===");
  //   console.log("newVehicleTableId:", newVehicleTableId);
  //   console.log(
  //     "segment dates:",
  //     currentSegment.startDate,
  //     "→",
  //     currentSegment.endDate,
  //   );
  //   console.log("excludeBookingId:", booking._id.toString());
  //   console.log("getVehicleTbl status:", newVehiclePricing.status);
  //   console.log("getVehicleTbl data length:", newVehiclePricing.data?.length);
  //   console.log("getVehicleTbl message:", newVehiclePricing.message);

  if (newVehiclePricing.status !== 200 || !newVehiclePricing.data?.length) {
    return { success: false, message: "Unable to fetch new vehicle pricing." };
  }

  const newVehiclePriced = newVehiclePricing.data[0];

  // --- Calculate difference ---
  const addonCost =
    Number(booking.bookingPrice.extraAddonPrice || 0) +
    Number(booking.bookingPrice.addonTax || 0);

  const addonProrated = (addonCost / totalBookingDuration) * daysLeft;

  const oldRemainingValue =
    (currentSegment.oldCost / segmentDays) * daysLeft + addonProrated;

  const newVehicleFullPrice =
    newVehiclePriced.totalRentalCost + Number(newVehiclePriced.tax || 0);

  const newRemainingCost =
    (newVehicleFullPrice / segmentDays) * daysLeft + addonProrated;

  const priceDifference = newRemainingCost - oldRemainingValue;

  const isExtraPayment = priceDifference > 1;
  const isRefund = priceDifference < -1;
  const isFreeSwap = !isExtraPayment && !isRefund;

  return {
    success: true,
    // segment info
    currentSegment,
    segmentDays,
    daysLeft,
    totalBookingDuration,
    // pricing
    oldRemainingValue: Math.round(oldRemainingValue),
    newRemainingCost: Math.round(newRemainingCost),
    priceDifference: Math.round(Math.abs(priceDifference)),
    isExtraPayment,
    isRefund,
    isFreeSwap,
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
