const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    vehicleMasterId: {
        type: Schema.Types.ObjectId,
        ref: 'vehicleMaster',
        required: true
    },
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
        type: String,
        required: true
    },
    BookingEndDateAndTime: {
        type: String,
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
    vehicleBrand: {
        type: String,
        required: true
    },
    vehicleImage: {
        type: String,
        required: true
    },
    vehicleName: {
        type: String,
        required: true
    },
    stationName: {
        type: String,
        required: true
    },
    stationMasterUserId: {
        type: String,
        required: true
    },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

bookingSchema.pre('save', function (next) {
    if (this.payInitFrom) {
      this.payInitFrom = this.payInitFrom.toLowerCase(); 
    }
    if (this.stationName) {
      this.stationName = this.stationName.toLowerCase(); 
    }
    if (this.vehicleName) {
      this.vehicleName = this.vehicleName.toLowerCase(); 
    }
    if (this.vehicleBrand) {
      this.vehicleBrand = this.vehicleBrand.toLowerCase(); 
    }
   
    next();
  });
  

const booking = mongoose.model('booking', bookingSchema);

module.exports = booking;


