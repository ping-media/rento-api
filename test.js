// // let currentNumber = 1;

// // function generateInvoiceNumber() {
// //   const currentYear = new Date().getFullYear();
// //   const staticPrefix = "Inv";

 
// //   const invoiceNumber = `${staticPrefix}${currentYear}${String(currentNumber).padStart(5, "0")}`;

 
// //   currentNumber++;

// //   return invoiceNumber;
// // }


// // console.log(generateInvoiceNumber()); // inv202400001
// // //console.log(generateInvoiceNumber()); // inv202400002


// const dayjs = require('dayjs');

// const date = dayjs("2024-11-30T01:00:00").toDate();
// console.log(date); // Sat Nov 30 2024 01:00:00 GMT+your timezone offset

// function getMilliseconds(dateString) {
//     if (!dateString) return "Invalid date";
  
//     const date = new Date(dateString);
//     if (isNaN(date)) return "Invalid date";
  
//     return date.getTime(); // Returns the time in milliseconds since January 1, 1970
//   }

// const milliseconds = getMilliseconds(new Date());
// console.log(milliseconds)


const makeDateTime = (datetimeString) => {
  // Split the input into date and time
  const [dateString, timeString] = datetimeString.split(" ");
  
  // Extract day, month, and year from the date
  const [day, month, year] = dateString.split("/");

  // Extract hour and minute from the time
  const [hour, minute] = timeString.split(":");

  // Ensure all parts are zero-padded
  const isoString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00Z`;

  return isoString;
};

console.log(makeDateTime("04/01/2025 13:00"));
