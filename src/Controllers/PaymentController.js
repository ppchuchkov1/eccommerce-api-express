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
    user: "7dc806001@smtp-brevo.com",
    pass: "jO7PU0ZC6SvkEsc4",
  },
});

// Stripe payment endpoint to create checkout session
const stripePayment = async (req, res) => {
  const { line_items, customerEmail } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: `https://stipe-react.netlify.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://stipe-react.netlify.app/cancel`,
      customer_email: customerEmail, // Attach the customer email to the session
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Webhook endpoint to handle Stripe events
const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Load email template
    const htmlTemplatePath = path.join(
      __dirname,
      "../payment-email-template.html"
    );

    fs.readFile(htmlTemplatePath, "utf-8", (err, htmlContent) => {
      if (err) {
        console.error("Error reading HTML file:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Prepare the email options
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: session.customer_email, // Using the customer email from the session
        subject: "Payment Successful",
        text: `Thank you for your purchase! Your payment was successful. Session ID: ${session.id}`,
        html: htmlContent,
      };

      // Send the confirmation email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    });
  }

  res.json({ received: true });
};

module.exports = {
  stripePayment,
  stripeWebhook,
};
