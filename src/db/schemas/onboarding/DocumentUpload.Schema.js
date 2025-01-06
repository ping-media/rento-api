const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    userId: {
      type:  Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    files: [
      {
        fileName: { type: String, required: true }, // Name of the file
        imageUrl: { type: String, required: true }, // URL of the file in S3
      },
    ],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
