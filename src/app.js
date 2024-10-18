require("dotenv").config();
const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const { swaggerMiddleware, swaggerSetup } = require("./SwaggerOptions");
const productRoutes = require("./Routes/ProductsRoutes");
const paymentRoutes = require("./Routes/PaymentRoutes");
const stripeWebHookRoutes = require("./Routes/StripeWebHookRoutes");
const connectMongoDB = require("./connections/mongo");

const app = express();
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "https://eccommerce-react.netlify.app/"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Зареждане на Socket.io логиката
require("./sockets/chatSupport")(io);

// MongoDB connection
connectMongoDB();

// Middleware
const corsOptions = {
  origin: ["http://localhost:3000", "https://eccommerce-react.netlify.app/"],
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

//Stripe webhook - NO bodyParser.json()
app.use("/api/payment", stripeWebHookRoutes);

app.use(bodyParser.json());

//Routes
app.use("/api/products", productRoutes);
app.use("/api/payment", paymentRoutes);

// Start the server using `server.listen` instead of `app.listen`
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
