const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
    },
    password: {
      type: String,
    },
    mobileToken: { type: String },
    mobileTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        platform: {
          type: String,
          enum: ["android", "ios"],
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    drivingLicence: {
      type: String,
      trim: true,
    },
    idProof: {
      type: String,
      trim: true,
    },
    addressProof: {
      type: String,
      trim: true,
    },

    addresses: {
      type: [{ type: String, trim: true }],
      default: [],
      // validate: {
      //   validator: function (arr) {
      //     return arr.length <= 5;
      //   },
      //   message: "Maximum 5 addresses allowed",
      // },
    },

    lastLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      capturedAt: { type: Date, default: null }, // when was this last updated
    },

    contact: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    altContact: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
    },
    dateofbirth: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "not specified", "others"],
      default: "not specified",
    },
    userType: {
      type: String,
      enum: ["manager", "customer", "admin"],
      required: true,
    },

    isEmailVerified: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    isContactVerified: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    isDocumentVerified: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    kycApproved: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletionReason: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", function (next) {
  if (this.firstName) {
    this.firstName = this.firstName.toLowerCase();
  }
  if (this.lastName) {
    this.lastName = this.lastName.toLowerCase();
  }
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  next();
});

// Auth & identity
// (contact already indexed via unique: true)
userSchema.index({ email: 1 });

// Role & status
userSchema.index({ userType: 1 });
userSchema.index({ status: 1 });

// Admin listing (MOST IMPORTANT)
userSchema.index({
  userType: 1,
  status: 1,
  createdAt: -1,
});

// KYC queues
userSchema.index({
  kycApproved: 1,
  status: 1,
});
userSchema.index({
  isDocumentVerified: 1,
  status: 1,
});

userSchema.index({ isDeleted: 1 });

// Pagination
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
