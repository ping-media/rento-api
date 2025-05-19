const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const slideSchema = new mongoose.Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  link: { type: String },
});

const testimonialSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, default: 5 },
});

const GeneralSchema = new Schema(
  {
    weakend: {
      Price: { type: Number, default: 0 },
      PriceType: { type: String, enum: ["+", "-"], default: "+" },
    },
    specialDays: [
      {
        From: { type: String, required: true },
        Too: { type: String, required: true },
        Price: { type: Number, required: true },
        PriceType: { type: String, enum: ["+", "-"], default: "+" },
      },
    ],
    GST: {
      percentage: { type: Number, default: 18 },
      status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    extraAddOn: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        name: { type: String, trim: true, lowercase: true, required: true },
        amount: { type: Number, min: 0, default: 0 },
        maxAmount: { type: Number, min: 0, default: 0 },
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
      },
    ],
    slides: {
      type: [slideSchema],
      validate: {
        validator: function (value) {
          return value.length <= 10;
        },
        message: "You can only have up to 10 slides.",
      },
    },
    info: {
      email: {
        type: String,
        required: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
      },
      contact: { type: Number, required: true },
      waContact: { type: Number, required: true },
      address: { type: String, required: true },
      socialmedia: {
        facebook: { type: String, default: "#" },
        instagram: { type: String, default: "#" },
        twitter: { type: String, default: "#" },
      },
      appLink: {
        IOS: { type: String, default: "#" },
        Android: { type: String, default: "#" },
      },
    },
    testimonial: {
      type: [testimonialSchema],
      validate: {
        validator: function (value) {
          return value.length <= 10;
        },
        message: "You can only have up to 10 testimonial.",
      },
    },
    maintenance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const general = mongoose.model("general", GeneralSchema);

module.exports = general;
