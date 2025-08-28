const router = require("express").Router();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZOR_KEY_ID,
  key_secret: process.env.VITE_RAZOR_KEY_SECRET,
});

router.get("/transactions", async (req, res) => {
  try {
    const { from, to, count = 50, skip = 0 } = req.query;

    const options = {
      count: parseInt(count),
      skip: parseInt(skip),
    };

    if (from) options.from = Math.floor(new Date(from).getTime() / 1000);
    if (to) options.to = Math.floor(new Date(to).getTime() / 1000);

    const payments = await razorpay.payments.all(options);

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

module.exports = router;
