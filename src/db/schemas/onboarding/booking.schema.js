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
    vehicleImage: {
        type: String,
        required: true
    },
    vehicleBrand: {
        type: String,
        required: true
    },
    
    vehicleName: {
        type: String,
        required: true
    },
    stationId: {
        type: String,
        //default:"Na"
       // required: true
    },
    stationName: {
        type: String,
        required: true
    },
    stationMasterUserId: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
    vehicleBasic: {
        type: Object,
        required: true
    },
    
    payInitFrom: {
        type: String,
        // required: true,
        default:"cash"
    },
    paySuccessId: {
        type: String,
        default:"NA"
       // required: true
    },
    paymentgatewayOrderId: {
        type: String,
        default:"NA"
       // required: true
    },
    
    paymentgatewayReceiptId: {
        type: String,
        default:"NA"
       // required: true
    },
    paymentInitiatedDate: {
        type: String,
        default:"NA"
       // required: true
    },
   
    discountCuopon: {
        type: Object,
       // default:"NA"
       // required: true
    },
   
    
    paymentMethod: {
        type: String,
        enum: ['cash', 'partiallyPay','online'],
        required: true
    },
    invoice: {
        type: Schema.Types.ObjectId,
        ref: 'invoice-tbl'
    },  
    bookingStatus: {
        enum: ['pending', 'done', 'canceled'],
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending','partiallyPay', 'paid', 'failed','refunded'],
        required: true
    },
    rideStatus: {
        enum: ['pending', 'completed', 'canceled'],
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
    if (this.payInitFrom) {
      this.payInitFrom = this.payInitFrom.toLowerCase(); 
    }
   
    next();
  });
  

const booking = mongoose.model('booking', bookingSchema);

module.exports = booking;


