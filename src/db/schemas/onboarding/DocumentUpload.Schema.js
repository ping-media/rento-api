const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    AadharImage: {
      type: String, // Define Image as a generic object
    },
    LicenseImage: {
      type: String, // Define Image as a generic object
    },
    userId: {
      type: String,
      ref: 'users',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

const Document = mongoose.model('Document', documentSchema);


module.exports = Document;