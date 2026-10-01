const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const zlib = require("zlib");
require("dotenv").config();

// adding routers
const onboardingRouters = require("./src/api/onboarding/routers/routers.model");

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  app.use(morgan("dev"));
  app.use("/public", express.static("public"));
  app.use(express.json({ extended: true, limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(bodyParser.json({ extended: true, limit: "50mb" }));
  app.use(
    bodyParser.urlencoded({
      limit: "50mb",
      extended: true,
      parameterLimit: 50000,
    }),
  );

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "token"],
    }),
  );
  app.options("*", cors());

  app.use("/assets", express.static(path.join(__dirname, "assets")));

  app.get("/favicon.ico", (_, res) => res.status(204).end());
  app.get("/favicon.png", (_, res) => res.status(204).end());

  app.get("/", (req, res) => {
    res.send("Hi there, Welcome to rento bikes");
  });

  app.get("/r/:data", (req, res) => {
    try {
      const compressed = Buffer.from(req.params.data, "base64url");
      const payload = JSON.parse(zlib.inflateRawSync(compressed).toString());
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${payload.p}&text=${encodeURIComponent(payload.m)}`;
      return res.redirect(302, whatsappUrl);
    } catch {
      return res.status(400).send("This link is invalid or malformed.");
    }
  });

  // use routes
  app.use(onboardingRouters);

  app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  });

  if (process.env.NODE_ENV !== "production") {
    app.get("/api/cron", async (req, res) => {
      console.log("🧪 Testing cron locally...");
      try {
        const cronHandler = require("./api/cron");
        await cronHandler(req, res);
      } catch (error) {
        console.error("❌ Cron error:", error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });
  }

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  // database connection
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB is connected...");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }

  // start server
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on PORT ${PORT}...`);
    });
  } else {
    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}...`);
    });
  }
};

startServer();
