const express = require("express");
const {
  stripePayment,
  stripeWebHook,
} = require("../Controllers/PaymentController");

const router = express.Router();

// Маршрут за създаване на сесия за плащане
router.post("/create-checkout-session", stripePayment);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebHook
);

module.exports = router;
