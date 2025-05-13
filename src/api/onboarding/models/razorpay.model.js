const razorpaywebhook = async (req, res) => {
  const crypto = require("crypto");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  const receivedSignature = req.headers["x-razorpay-signature"];

  if (expectedSignature === receivedSignature) {
    const payload = req.body;
    console.log("Webhook verified:", payload);

    res.status(200).json({ status: "ok" });
  } else {
    res.status(400).json({ status: "invalid signature" });
  }
};

module.exports = { razorpaywebhook };
