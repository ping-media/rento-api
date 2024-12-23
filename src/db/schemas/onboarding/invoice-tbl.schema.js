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
   vehicleName: {
    type: String,
    required: true
  },
 
  bookingPrice: {
    type: Object,
    required: true
  },
  vehicleBasic: {
    type: Object,
    required: true
  },
  paidInvoice: {
    type: String,
    enum: ['pending','partiallyPay','partially_paid', 'paid', 'failed','refunded'],
    required: true
  },
 
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const invoiceTbl = mongoose.model('invoiceTbl', invoiceSchema);

module.exports = invoiceTbl;


