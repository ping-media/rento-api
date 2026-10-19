const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Day of week (0-6) of a date as seen in India, whatever timezone the server runs in
const getDayInIST = (dateInput) => {
  if (dateInput === undefined || dateInput === null || dateInput === "") {
    return null;
  }

  // handle timestamps sent as numeric strings, e.g. "1760000000000"
  const value =
    typeof dateInput === "string" && /^\d+$/.test(dateInput.trim())
      ? Number(dateInput)
      : dateInput;

  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  return date.getUTCDay();
};

/**
 * Checks if the given date falls on the station's weekly off.
 */
const checkStationWeeklyOff = (station, dateInput) => {
  const weeklyOff = station?.stationWeeklyOff;

  // null / undefined => station has no weekly off
  if (weeklyOff === null || weeklyOff === undefined) {
    return { isOff: false };
  }

  const day = getDayInIST(dateInput);
  if (day === null || day !== Number(weeklyOff)) {
    return { isOff: false };
  }

  const dayName = DAY_NAMES[day];
  const nextDayName = DAY_NAMES[(day + 1) % 7];

  return {
    isOff: true,
    dayName,
    message: `Station is closed on ${dayName} (HOLIDAY). Please change the start date to ${nextDayName} or another day.`,
  };
};

module.exports = { checkStationWeeklyOff, getDayInIST };
