const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    files: [
      {
        fileName: { type: String, required: true },
        imageUrl: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
);

// indexing
documentSchema.index({ userId: 1 }, { unique: true });

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
