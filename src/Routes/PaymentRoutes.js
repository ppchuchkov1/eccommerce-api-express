const express = require("express");
const { stripePayment, webhook } = require("../Controllers/PaymentController");

const router = express.Router();

router.post("/create-checkout-session", stripePayment);
router.post("/webhook", webhook);

module.exports = router;
