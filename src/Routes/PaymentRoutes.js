const express = require("express");
const {
  stripePayment,
  stripeWebhook,
} = require("../Controllers/PaymentController");

const router = express.Router();

// Маршрут за създаване на сесия за плащане
router.post("/create-checkout-session", stripePayment);
// Route to handle Stripe webhook
router.post("/webhook", stripeWebhook);

module.exports = router;
