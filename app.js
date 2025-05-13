const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// adding routers
const onboardingRouters = require("./src/api/onboarding/routers/routers.model");

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  app.use(morgan("dev"));
  app.set("views", path.join(__dirname, "/src/views/pages"));
  app.use("/public", express.static("public"));
  app.use(express.json({ extended: true, limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(bodyParser.json({ extended: true, limit: "50mb" }));
  app.use(
    bodyParser.urlencoded({
      limit: "50mb",
      extended: true,
      parameterLimit: 50000,
    })
  );

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "token"],
    })
  );
  app.options("*", cors());

  app.use("/assets", express.static(path.join(__dirname, "assets")));

  app.get("/", (req, res) => {
    res.send("Hi there, Welcome to rento bikes");
  });

  // use routes
  app.use(onboardingRouters);

  // database connection
  try {
    mongoose.connect(process.env.DB_URL);
    console.log("MongoDB is connected...");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}...`);
  });
};

startServer();
