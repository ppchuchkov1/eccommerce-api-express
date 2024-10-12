const fs = require("fs").promises;
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

// Stripe payment endpoint
const stripePayment = async (req, res) => {
  const { line_items, customerEmail } = req.body;

  if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
    return res.status(400).json({ error: "Invalid line items" });
  }

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

// Webhook endpoint
const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Get customer email from the session
    const customerEmail = session.customer_email; // Use customer_email if set

    // Read the HTML template
    const htmlTemplatePath = path.join(
      __dirname,
      "../payment-email-template.html"
    );

    try {
      const htmlContent = await fs.readFile(htmlTemplatePath, "utf-8");

      // Send confirmation email
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: customerEmail,
        subject: "Payment Successful",
        text: `Thank you for your purchase! Your payment was successful. Session ID: ${session.id}`,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully.");
    } catch (error) {
      console.error("Error reading HTML file or sending email:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};

module.exports = {
  stripePayment,
  webhook,
};
