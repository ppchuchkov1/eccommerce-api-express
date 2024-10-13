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

  console.log("Raw Body:", req.rawBody); // Лог на суровото съдържание

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Обработка на събитията
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Вземете email на клиента от сесията
    const customerEmail = session.customer_email;

    // Четене на HTML шаблона
    const htmlTemplatePath = path.join(
      __dirname,
      "../payment-email-template.html"
    );

    fs.readFile(htmlTemplatePath, "utf-8", (err, htmlContent) => {
      if (err) {
        console.error("Error reading HTML file:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Изпращане на потвърдителен имейл
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: customerEmail,
        subject: "Payment Successful",
        text: `Thank you for your purchase! Your payment was successful. Session ID: ${session.id}`,
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
  }

  // Върнете отговор, за да потвърдите получаването на събитието
  res.json({ received: true });
};

module.exports = {
  stripePayment,
  webhook,
};
