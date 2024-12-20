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
  userId: {
    type: String,
    ref: 'users',
    required: true
  },
  paidInvoice: {
    type: String,
    enum: ['pending','partiallyPay', 'paid', 'failed','refunded'],
    required: true
  },
  bookingPrice: {
    type: Object,
    required: true
  },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const invoiceTbl = mongoose.model('invoiceTbl', invoiceSchema);

module.exports = invoiceTbl;


