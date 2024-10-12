const express = require("express");
const Stripe = require("stripe");
const fs = require("fs").promises;
const path = require("path");
const nodemailer = require("nodemailer");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// Middleware за raw body
app.use(
  express.json() // Позволява JSON тела за други ендпойнти
);

// Webhook endpoint с raw body
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Проверка на подписа и парсиране на raw body
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Обработка на събитието
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Обработка на успешното плащане
      const customerEmail = session.customer_email;

      try {
        const htmlTemplatePath = path.join(
          __dirname,
          "../payment-email-template.html"
        );
        const htmlContent = await fs.readFile(htmlTemplatePath, "utf-8");

        // Изпращане на имейл
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

    // Върни отговор за полученото събитие
    res.json({ received: true });
  }
);

// Stripe payment endpoint
app.post("/api/payment", async (req, res) => {
  const { line_items } = req.body;

  if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
    return res.status(400).json({ error: "Invalid line items" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `https://stipe-react.netlify.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://stipe-react.netlify.app/cancel`,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Започни сървъра
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
