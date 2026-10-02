const zlib = require("zlib");

function toWhatsappUrl(phoneNumber, message) {
  const payload = JSON.stringify({ p: phoneNumber, m: message });
  const compressed = zlib.deflateRawSync(payload).toString("base64url");
  return `https://api.rentobikes.com/r/${compressed}`;
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripVehicleYear(vehicleName) {
  return vehicleName.replace(/\s*\(\d{4}\)\s*/g, "").trim();
}

function buildConfirmationMessage({
  bookingId,
  customerName,
  vehicleName,
  vehicleNo,
  hubLocation,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
  location,
  bookingPrice,
  discount,
  accessoriesTotal,
  finalTotal,
  paid,
  balancePayable,
  deposit,
  distanceLimit,
  extraUsageRate,
  lateFee,
  speedLimit,
}) {
  const paymentLines = [
    `Booking Price: \u20b9${bookingPrice}`,
    discount ? `Discount: \u20b9${discount}` : null,
    accessoriesTotal ? `Accessories: \u20b9${accessoriesTotal}` : null,
    `Final Total: \u20b9${finalTotal}`,
    `Paid: \u20b9${paid}`,
    `Balance Payable: \u20b9${balancePayable}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `\u{1F3CD}\uFE0F RENTO BIKES 
  
\u2013 BOOKING CONFIRMATION

Hello *${toTitleCase(customerName)}* \u{1F44B}

Your booking details are below:

\u{1F4CB} Booking ID: *#${bookingId}*
\u{1F3CD}\uFE0F Vehicle: *${toTitleCase(stripVehicleYear(vehicleName))}*
\u{1F522} Vehicle No: *${vehicleNo}*
\u{1F4CD} Pickup & Drop Hub: *${hubLocation}*
\u{1F4C5} Pickup: *${pickupDate}, ${pickupTime}*
\u{1F4C5} Drop-off: *${dropDate}, ${dropTime}*

\u{1F4CD} PICKUP & RETURN LOCATION
${location}

\u{1F4B0} PAYMENT
${paymentLines}

\u{1F4CC} IMPORTANT
\u2022 Refundable Deposit: \u20b9${deposit}
\u2022 Distance Limit: ${distanceLimit} km
\u2022 Extra Usage: \u20b9${extraUsageRate}/km
\u2022 Late Fee: \u20b9${lateFee}/hour
\u2022 Speed Limit: ${speedLimit} km/h
\u2022 Fuel: Not Included
\u2022 Original Driving Licence required at pickup.

Thank you for choosing Rento Bikes! \u{1F6F5}`;
}

function buildReminderMessage({
  customerName,
  bookingId,
  vehicleName,
  vehicleNumber,
  dropDate,
  dropTime,
  dropLocation,
  lateFee,
  supportContact,
}) {
  const cleanVehicleName = toTitleCase(stripVehicleYear(vehicleName));

  return `\u{1F514} *RENTO BIKES* 
  
\u2014 REMINDER REQUEST 

Hello *${toTitleCase(customerName)}* \u{1F44B}

Your bike rental is *ending soon*.

\u{1F4CB} Booking ID: *#${bookingId}*
\u{1F3CD}\uFE0F Vehicle: *${cleanVehicleName}*
\u{1F522} Vehicle No: *${vehicleNumber}*

\u{1F4C5} Return Date: *${dropDate}*
\u23F0 Return Time: *${dropTime}*
\u{1F4CD} Return Location: ${dropLocation}

Please *RETURN* the vehicle on time or *EXTEND* your ride through the Rento Bikes app.

\u{1F4B0} *Late Fee:* \u20b9${lateFee}/hour

\u26A0\uFE0F Please do not keep the vehicle beyond the scheduled return time without extending your booking.

Need help with your booking?
\u{1F4DE} *Rento Bikes Support:* ${supportContact}

Thank you for choosing *Rento Bikes!* \u{1F6F5}`;
}

function buildCompletedMessage({
  bookingId,
  customerName,
  vehicleName,
  vehicleNo,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  startKm,
  endKm,
  totalKm,
  freeKm,
  extraKm,
  rentalAmount,
  extraCharges,
  extensionCharges,
  vehicleChangeCharges,
  discount,
  finalAmount,
  amountPaid,
  deposit,
  depositRefunded,
  balancePayable,
  reviewLink,
}) {
  const cleanVehicleName = toTitleCase(stripVehicleYear(vehicleName));
  const paymentLines = [
    `Rental Amount: \u20b9${rentalAmount}`,
    extraCharges ? `Extra Charges: \u20b9${extraCharges}` : null,
    extensionCharges ? `Extension Charges: \u20b9${extensionCharges}` : null,
    vehicleChangeCharges
      ? `Vehicle Change Charges: \u20b9${vehicleChangeCharges}`
      : null,
    discount ? `Discount: \u20b9${discount}` : null,
    `Final Amount: \u20b9${finalAmount}`,
    `Amount Paid: \u20b9${amountPaid}`,
  ]
    .filter(Boolean)
    .join("\n");

  const depositLines = [
    `Deposit Collected: \u20b9${deposit}`,
    depositRefunded ? `Deposit Refunded: \u20b9${depositRefunded}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const reviewBlock = reviewLink ? `\n\nRate Us on Google ${reviewLink}` : "";

  return `\u{1F3C1} RENTO BIKES 
  
\u2013 RIDE COMPLETED

Hello *${toTitleCase(customerName)}* \u{1F44B}

Your ride has been successfully completed.

\u{1F4CB} BOOKING DETAILS
Booking ID: *#${bookingId}*
Vehicle: *${cleanVehicleName}*
Vehicle No: *${vehicleNo}*

\u{1F4C5} RENTAL PERIOD
Pickup: *${pickupDate}, ${pickupTime}*
Returned: *${returnDate}, ${returnTime}*


\u{1F6E3}\uFE0F DISTANCE
Starting KM: ${startKm}km
Ending KM: ${endKm} km
Total Used: ${totalKm} km
Free KM: ${freeKm} km
Extra KM: ${extraKm} km


\u{1F4B0} PAYMENT SUMMARY
${paymentLines}

\u{1F510} SECURITY DEPOSIT
${depositLines}

\u{1F4B3} FINAL BALANCE
Balance Payable: \u20b9${balancePayable}

\u2705 BOOKING STATUS: COMPLETED

Thank you for choosing Rento Bikes! \u{1F6F5}
We hope you had a great ride.${reviewBlock}`;
}

function buildExtensionConfirmedMessage({
  bookingId,
  vehicleName,
  vehicleNo,
  stationLocation,
  newDropDate,
  newDropTime,
  amountPaid,
  customerName,
  supportContact,
}) {
  const cleanVehicleName = toTitleCase(stripVehicleYear(vehicleName));
  const location =
    stationLocation || "Please contact support for location details";

  return `\u{1F6F5} *RENTO BIKES* \u{1F6F5}

\u{1F514} EXTENSION CONFIRMATION

Hello *${toTitleCase(customerName)}* \u{1F44B}

Your ride extension has been *confirmed successfully*. \u2705

\u{1F4CB} Booking ID: #*${bookingId}*
\u{1F3CD}\uFE0F Vehicle: *${cleanVehicleName}*
\u{1F522} Vehicle No: *${vehicleNo}*

\u{1F4C5} New Return Date: *${newDropDate}*
\u23F0 New Return Time: *${newDropTime}*
\u{1F4CD} Return Location: *${location}*

\u{1F4B0} Amount Paid: *\u20b9${amountPaid}*

Thank you for choosing *Rento Bikes!* \u{1F6F5}
\u{1F4DE} Support: ${supportContact}`;
}

function buildExtensionRequestMessage({
  customerName,
  bookingId,
  vehicleName,
  vehicleNo,
  extensionDuration,
  payableAmount,
  paymentLink,
  supportContact,
}) {
  const cleanVehicleName = toTitleCase(stripVehicleYear(vehicleName));
  return `\u{1F6F5} *RENTO BIKES* \u{1F6F5}

\u{1F514} EXTENSION REQUEST

Hello *${toTitleCase(customerName)}*\u{1F44B}

You have requested to extend your ride. Please complete the payment to confirm your extension.

\u{1F4CB} Booking ID: *#${bookingId}*
\u{1F3CD}\uFE0F Vehicle: *${cleanVehicleName}*
\u{1F522} Vehicle No:*${vehicleNo}*

\u{1F4C5} EXTENSION DURATION: *${extensionDuration} day(s)*

\u{1F4B0} Payable Amount: *\u20b9${payableAmount}*

PAYMENT LINK: *${paymentLink}*

Your extension will be confirmed only after the payment is completed.

Need help?
\u{1F4DE} Rento Bikes Support: ${supportContact}`;
}

module.exports = {
  toWhatsappUrl,
  buildConfirmationMessage,
  buildReminderMessage,
  buildCompletedMessage,
  buildExtensionConfirmedMessage,
  buildExtensionRequestMessage,
};
