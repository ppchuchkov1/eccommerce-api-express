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

// Stripe payment endpoint
const stripePayment = async (req, res) => {
  const { line_items, customerEmail } = req.body;

  try {
    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: customerEmail, // Store the customer email
    });

    // Create a checkout session with the customer ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: `https://stipe-react.netlify.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://stipe-react.netlify.app/cancel`,
      customer: customer.id, // Associate the session with the customer
      metadata: {
        customerEmail, // Store customer email
      },
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeWebHook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const checkoutSessionCompleted = event.data.object;

      // Get the customer email from metadata
      const customerEmail = checkoutSessionCompleted.metadata.customerEmail;
      console.log(customerEmail);

      // Read the HTML email template
      const htmlTemplatePath = path.join(
        __dirname,
        "../payment-email-template.html"
      );

      fs.readFile(htmlTemplatePath, "utf-8", (err, htmlContent) => {
        if (err) {
          console.error("Error reading HTML file:", err);
          return; // You can log or handle the error here if needed
        }

        // Send the confirmation email
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: customerEmail,
          subject: "Payment Successful",
          text: `Thank you for your purchase! Your payment was successful. Session ID: ${checkoutSessionCompleted.id}`,
          html: htmlContent,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      });
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};

module.exports = {
  stripePayment,
  stripeWebHook,
};
