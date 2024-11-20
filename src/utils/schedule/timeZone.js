const moment = require('moment');
const momentTimezone = require('moment-timezone');

// Local date
const date = moment().format('YYYY-MM-DD HH:mm:ss');

// Get time zone
const timezone = momentTimezone.tz.guess();

// Convert current time to UTC
const utc = moment.utc().format('YYYY-MM-DD HH:mm:ss');

// Convert UTC to the guessed time zone
const local = moment.utc(utc).tz(timezone).format('YYYY-MM-DD HH:mm:ss');


// Local time to utc
const utcTime = moment.utc(date).format('YYYY-MM-DD HH:mm:ss');


 function convertUtcToLocalTime(utcTime, timezone) {
  return moment.utc(utcTime).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
}

function convertLocalTimeToUtc(localTime, timezone) {
  return moment.tz(localTime, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
}



// get all timezones
function getTimezones() {
    return momentTimezone.tz.names();
}

// get timezone of the system
function getTimezone() {
    return momentTimezone.tz.guess();
}

console.log('local date: ', date);
console.log('timezone: ', timezone);
console.log('utc: ', utc);
console.log('local: ', local);


// convert utc to local time
console.log('utc to local time: ', convertUtcToLocalTime(utc, timezone));

module.exports = {
    convertUtcToLocalTime,
    convertLocalTimeToUtc,
    getTimezones,
    getTimezone
};
