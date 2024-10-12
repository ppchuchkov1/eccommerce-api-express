// src/swagger.js
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0", // Specify the OpenAPI version
    info: {
      title: "Product API",
      version: "1.0.0",
      description: "API for managing products",
    },
    servers: [
      {
        url: "http://localhost:5001", // Replace with your server URL
      },
    ],
  },
  apis: ["./src/Routes/*.js"], // Path to the API docs
};

// Create Swagger documentation
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware to serve Swagger UI
const swaggerMiddleware = swaggerUi.serve;
const swaggerSetup = swaggerUi.setup(swaggerDocs);

module.exports = { swaggerMiddleware, swaggerSetup };
