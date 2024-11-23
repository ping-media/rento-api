const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'booking',
        required: true
    },
    BookingDateAndTime: {
        type: Object,
        required: true
    }, 
     userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
    
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const VehicleBookrecode = mongoose.model('VehicleBookrecode', bookingSchema);

module.exports = VehicleBookrecode;


