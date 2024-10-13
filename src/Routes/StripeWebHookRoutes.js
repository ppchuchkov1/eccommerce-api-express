const express = require("express");
const { stripeWebHook } = require("../Controllers/PaymentController");

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebHook
);

module.exports = router;
