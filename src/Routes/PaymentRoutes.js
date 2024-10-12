const express = require("express");
const bodyParser = require("body-parser"); // Добавен импорт на body-parser
const { stripePayment, webhook } = require("../Controllers/PaymentController");

const router = express.Router();

// Middleware за обработка на суровото тяло
const rawBodyBuffer = (req, res, buf, encoding) => {
  if (encoding !== "utf-8") {
    return;
  }
  req.rawBody = buf.toString(encoding);
};

// Маршрут за създаване на сесия за плащане
router.post("/create-checkout-session", stripePayment);
// Маршрут за webhook
router.post("/webhook", bodyParser.json({ verify: rawBodyBuffer }), webhook);

module.exports = router;
