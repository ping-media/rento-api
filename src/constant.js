const contactValidation = (contact) => {
  const pattern = /^\d{10}$/;
  return pattern.test(contact);
};

const emailValidation = (email) => {
  const pattern = /\S+@\S+\.\S+/;
  return pattern.test(email);
};

function convertTo24Hour(timeString) {
  // Split the string into time and period (AM/PM)
  const [time, period] = timeString.split(" "); // "10:00 PM" -> ["10:00", "PM"]
  const [hour, minutes] = time.split(":"); // "10:00" -> ["10", "00"]

  // Convert hour to a number and adjust for PM/AM
  let hour24 = parseInt(hour, 10);
  if (period === "PM" && hour24 !== 12) {
    hour24 += 12; // Convert PM to 24-hour format
  } else if (period === "AM" && hour24 === 12) {
    hour24 = 0; // Convert 12 AM to 0
  }

  return hour24; // Return only the hour in 24-hour format
}

module.exports = {
  contactValidation,
  emailValidation,
  convertTo24Hour,
};
