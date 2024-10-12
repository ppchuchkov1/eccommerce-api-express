// seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./Models/ProductsModel"); // Import the Product model

// Sample product data
const products = [
  {
    name: "Product 1",
    price: 19.99,
    description: "Description for Product 1",
    stock: 100,
  },
  {
    name: "Product 2",
    price: 29.99,
    description: "Description for Product 2",
    stock: 200,
  },
  {
    name: "Product 3",
    price: 39.99,
    description: "Description for Product 3",
    stock: 150,
  },
];

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Remove existing products
    await Product.deleteMany();

    // Insert sample products
    const insertedProducts = await Product.insertMany(products);
    console.log("Products seeded:", insertedProducts);
  } catch (error) {
    console.error("Error seeding products:", error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
};

// Run the seed function
seedProducts();
