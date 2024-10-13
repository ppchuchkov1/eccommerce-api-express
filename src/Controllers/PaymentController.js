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

    // Send email with the customer email and session details
    req.session.customerEmail = customerEmail; // Store customer email in the session
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const stripeWebhook = async (req, res) => {
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

  // Handle specific events
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log(`Payment successful! Session ID: ${session.id}`);

      // Send a confirmation email
      const customerEmail = session.customer_email || "default@example.com"; // Use the email from the session or a default one
      const mailOptions = {
        from: "your-email@example.com", // Replace with your email
        to: customerEmail,
        subject: "Payment Successful",
        text: `Thank you for your payment! Your session ID is ${session.id}.`,
        // You can also add HTML content here if you prefer
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${customerEmail}`);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
      break;

    // Add handling for other event types as needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};

module.exports = {
  stripePayment,
  stripeWebhook,
};
