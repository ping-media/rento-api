const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    vehicleTableId: {
        type: Schema.Types.ObjectId,
        ref: 'vehicleTable',
        required: true
    }, 
    bookingId: {
        type: String,
        required: true
    }, 
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    BookingStartDateAndTime: {
        type: Object,
        required: true
    },
    BookingEndDateAndTime: {
        type: Object,
        required: true
    },
    bookingPrice: {
        type: Object,
        required: true
    },
    bookingStatus: {
        enum: ['pending', 'completed', 'canceled'],
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'canceled'],
        required: true
    },
    rideStatus: {
        enum: ['pending', 'completed', 'canceled'],
        type: String,
        required: true
    },
    invoice: {
        type: Schema.Types.ObjectId,
        ref: 'invoice-tbl'
    },  
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'wallet'],
        required: true
    },
    payInitFrom: {
        type: String,
        required: true
    },
    paySuccessId: {
        type: String,
        required: true
    },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const booking = mongoose.model('booking', bookingSchema);

module.exports = booking;


