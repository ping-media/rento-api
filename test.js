let currentNumber = 1;

function generateInvoiceNumber() {
  const currentYear = new Date().getFullYear();
  const staticPrefix = "Inv";

 
  const invoiceNumber = `${staticPrefix}${currentYear}${String(currentNumber).padStart(5, "0")}`;

 
  currentNumber++;

  return invoiceNumber;
}


console.log(generateInvoiceNumber()); // inv202400001
//console.log(generateInvoiceNumber()); // inv202400002
