const express = require("express");
const { stripePayment } = require("../Controllers/PaymentController");

const router = express.Router();

// Маршрут за създаване на сесия за плащане
router.post("/create-checkout-session", stripePayment);

module.exports = router;
