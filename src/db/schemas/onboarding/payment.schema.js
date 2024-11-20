const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  status: {
    type: String,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const payment = mongoose.model('payment', paymentSchema);

module.exports = payment;
