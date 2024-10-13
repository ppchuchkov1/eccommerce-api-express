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

    // Изпращане на потвърдителен имейл
    const htmlTemplatePath = path.join(
      __dirname,
      "../payment-email-template.html"
    );

    fs.readFile(htmlTemplatePath, "utf-8", (err, htmlContent) => {
      if (err) {
        console.error("Error reading HTML file:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Изпращане на имейл
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
          return res.status(500).json({ error: "Failed to send email." });
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  stripePayment,
};
