const express = require("express");
const router = require("express").Router();
const Razorpay = require("razorpay");
const { razorpaywebhook } = require("../models/razorpay.model");

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZOR_KEY_ID,
  key_secret: process.env.VITE_RAZOR_KEY_SECRET,
});

router.get("/transactions", async (req, res) => {
  try {
    const { from, to, count = 20, skip = 0 } = req.query;

    const options = {
      from: from ? parseInt(new Date(from).getTime() / 1000) : undefined,
      to: to ? parseInt(new Date(to).getTime() / 1000) : undefined,
      count: parseInt(count),
      skip: parseInt(skip),
    };

    const payments = await razorpay.payments.all(options);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post(
  "/razorpay/webhook",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
  async (req, res) => {
    razorpaywebhook(req, res);
  }
);

module.exports = router;
