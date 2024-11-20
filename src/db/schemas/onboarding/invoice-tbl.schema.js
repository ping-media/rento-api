const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },
    bookingId: {
      type: String,
      required: true  
    },
    pdfDoc: {
      type: String,
      required: true      
    },
    paidInvoice: {
      type: String,
      enum: ['paid', 'unpaid'],
      required: true
    }
  }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
  
  const invoiceTbl = mongoose.model('invoiceTbl', invoiceSchema);
  
  module.exports = invoiceTbl;
  

  