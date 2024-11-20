const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingDurationSchema = new Schema({
    bookingDuration: {
        type: Object,
        required: true
    },
    attachedVehicles: {
        type: Array,
        required: true
    }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const bookingDuration = mongoose.model('bookingDuration', bookingDurationSchema);

module.exports = bookingDuration;


