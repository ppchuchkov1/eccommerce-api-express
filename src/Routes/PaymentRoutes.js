const express = require("express");
const { stripePayment, webhook } = require("../Controllers/PaymentController");

const router = express.Router();

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (encoding !== "utf-8") {
    return;
  }
  req.rawBody = buf.toString(encoding);
};

router.post("/create-checkout-session", stripePayment);
router.post("/webhook", bodyParser.json({ verify: rawBodyBuffer }), webhook);

module.exports = router;
