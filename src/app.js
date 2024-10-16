require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { swaggerMiddleware, swaggerSetup } = require("./SwaggerOptions");
const productRoutes = require("./Routes/ProductsRoutes");
const paymentRoutes = require("./Routes/PaymentRoutes");
const stripeWebHookRoutes = require("./Routes/StripeWebHookRoutes");
const connectMongoDB = require("./connections/mongo");

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB connection
connectMongoDB();

// Middleware
const corsOptions = {
  origin: ["http://localhost:3000", "https://stipe-react.netlify.app"],
  methods: ["GET", "POST"],
  credentials: true,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};

app.use(cors(corsOptions));
app.use("/api-docs", swaggerMiddleware, swaggerSetup);
//Stripe web hook
app.use("/api/payment", stripeWebHookRoutes);

app.use(bodyParser.json());
//Routes
app.use("/api/products", productRoutes);
app.use("/api/payment", paymentRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
