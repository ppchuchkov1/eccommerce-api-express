const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");
const nodemailer = require("nodemailer");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "7dc806001@smtp-brevo.com", // заменете с вашите креденшъли
    pass: process.env.BREVO_APP_PASSWORD, // използва се от .env файла
  },
});

// Stripe payment endpoint
const stripePayment = async (req, res) => {
  const { line_items, customerEmail } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: `https://stipe-react.netlify.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://stipe-react.netlify.app/cancel`,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const stripeWebhook = (req, res) => {
  const endpointSecret =
    "whsec_8179dfc3993168f5cafdf007bb98ea34abb33ad235af6fdd249c21e86c656684";
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Обработка на конкретни събития
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log(`Payment successful! Session ID: ${session.id}`);
      // Вашата логика за обработка на успешни плащания
      break;
    // Добавете обработка за други типове събития, ако е необходимо
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Върнете 200 отговор, за да потвърдите получаването на събитието
  res.send();
};

module.exports = {
  stripePayment,
  stripeWebhook,
};
