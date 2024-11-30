// let currentNumber = 1;

// function generateInvoiceNumber() {
//   const currentYear = new Date().getFullYear();
//   const staticPrefix = "Inv";

 
//   const invoiceNumber = `${staticPrefix}${currentYear}${String(currentNumber).padStart(5, "0")}`;

 
//   currentNumber++;

//   return invoiceNumber;
// }


// console.log(generateInvoiceNumber()); // inv202400001
// //console.log(generateInvoiceNumber()); // inv202400002


const dayjs = require('dayjs');

const date = dayjs("2024-11-30T01:00:00").toDate();
console.log(date); // Sat Nov 30 2024 01:00:00 GMT+your timezone offset



