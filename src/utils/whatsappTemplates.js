const zlib = require("zlib");

function toWhatsappUrl(phoneNumber, message) {
  const payload = JSON.stringify({ p: phoneNumber, m: message });
  const compressed = zlib.deflateRawSync(payload).toString("base64url");
  return `https://api.rentobikes.com/r/${compressed}`;
}
// function toWhatsappUrl(phoneNumber, message) {
//   return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
// }

function buildConfirmationMessage({
  bookingId,
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

  return `\u{1F3CD}\uFE0F RENTO BIKES \u2013 BOOKING CONFIRMATION

Hello \u{1F44B}

Your booking details are below:

\u{1F4CB} Booking ID: #${bookingId}
\u{1F3CD}\uFE0F Vehicle: ${vehicleName}
\u{1F522} Vehicle No: ${vehicleNo}
\u{1F4CD} Pickup & Drop Hub: ${hubLocation}
\u{1F4C5} *Pickup: ${pickupDate}, ${pickupTime}*
\u{1F4C5} *Drop-off: ${dropDate}, ${dropTime}*

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
}) {
  return `\u{1F514} RENTO BIKES \u2013 RIDE REMINDER

Hello ${customerName} \u{1F44B}

Your bike rental is ending soon.

\u{1F4CB} Booking ID: #${bookingId}
\u{1F3CD}\uFE0F ${vehicleName}
${vehicleNumber}


\u{1F4C5} Return: ${dropDate}
\u23F0 Time: ${dropTime}
\u{1F4CD} ${dropLocation}

Please *RETURN the vehicle on time* or *EXTEND your ride* through the Rento Bikes app.

\u{1F4B0} Late Fee: \u20b9${lateFee}/hour

\u26A0\uFE0F Please do not keep the vehicle beyond the scheduled time without extending your booking.

Thank you for choosing Rento Bikes! \u{1F6F5}`;
}

function buildCompletedMessage({
  bookingId,
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
  discount,
  finalAmount,
  amountPaid,
  deposit,
  depositRefunded,
  balancePayable,
  reviewLink,
}) {
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

  return `\u{1F3C1} RENTO BIKES \u2013 RIDE COMPLETED

Hello \u{1F44B}

Your ride has been successfully completed.

\u{1F4CB} BOOKING DETAILS
Booking ID: #${bookingId}
Vehicle: ${vehicleName}
Vehicle No:${vehicleNo}

\u{1F4C5} RENTAL PERIOD
Pickup: ${pickupDate}, ${pickupTime}
Returned: ${returnDate}, ${returnTime}


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
  extensionStart,
  extensionStartTime,
  extensionEnd,
  extensionEndTime,
  extensionDuration,
  amountPaid,
  newDropDate,
  newDropTime,
}) {
  return `\u2705 RENTO BIKES \u2013 EXTENSION CONFIRMED

Hello \u{1F44B}

Your ride has been extended successfully.

\u{1F4CB} Booking ID: #${bookingId}
\u{1F3CD}\uFE0F Vehicle: ${vehicleName}
\u{1F522} Vehicle No: ${vehicleNo}

\u{1F4C5} EXTENSION PERIOD
From: ${extensionStart}, ${extensionStartTime}
To: ${extensionEnd}, ${extensionEndTime}
Duration: ${extensionDuration} day(s)

\u{1F4B0} Amount Paid: \u20b9${amountPaid}

\u{1F4C5} *New Drop-off: ${newDropDate}, ${newDropTime}*
\u{1F4CD} DROP LOCATION
${stationLocation}

Thank you for choosing Rento Bikes! \u{1F6F5}`;
}

function buildExtensionRequestMessage({
  bookingId,
  vehicleName,
  vehicleNo,
  stationLocation,
  extensionStart,
  extensionStartTime,
  extensionEnd,
  extensionEndTime,
  extensionDuration,
  payableAmount,
  newDropDate,
  newDropTime,
  paymentLink,
}) {
  return `\u{1F514} RENTO BIKES \u2013 EXTENSION REQUEST

Hello \u{1F44B}

You requested to extend your ride. Please complete the payment to confirm.

\u{1F4CB} Booking ID: #${bookingId}
\u{1F3CD}\uFE0F Vehicle: ${vehicleName}
\u{1F522} Vehicle No: ${vehicleNo}

\u{1F4C5} EXTENSION PERIOD (on payment confirmation)
From: ${extensionStart}, ${extensionStartTime}
To: ${extensionEnd}, ${extensionEndTime}
Duration: ${extensionDuration} day(s)

\u{1F4B0} Payable Amount: \u20b9${payableAmount}

\u{1F4C5} *New Drop-off: ${newDropDate}, ${newDropTime}*
\u{1F4CD} DROP LOCATION
${stationLocation}

\u{1F517} Complete Payment:
${paymentLink}

\u26A0\uFE0F Your extension will be confirmed only after payment is completed.

Thank you for choosing Rento Bikes! \u{1F6F5}`;
}

module.exports = {
  toWhatsappUrl,
  buildConfirmationMessage,
  buildReminderMessage,
  buildCompletedMessage,
  buildExtensionConfirmedMessage,
  buildExtensionRequestMessage,
};
