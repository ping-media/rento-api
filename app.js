/* eslint-disable linebreak-style */
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

// adding routers
const onboardingRouters = require("./src/api/onboarding/routers/routers.model");

async function logs(data) {
  console.log(`${new Date().toISOString()} - ${data}`);
}

const PORT = process.env.PORT || 8080;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`)
);

const io = require("socket.io")(server, {
  //pingTimeout: 60000,
  cors: {
    origin: ['http://localhost:3000', 'https://promise-web.pages.dev', 'https://rento.indyside.com', 'http://localhost:3001', 'http://192.168.1.16:5173', 'http://192.168.1.16:5174', 'https://rent-moto-admin.vercel.app', 'https://rent-moto-front-end.vercel.app']
  },
});
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
    cors({ origin: ['http://localhost:3000', 'https://promise-web.pages.dev', 'http://127.0.0.1:5501', 'http://192.168.1.16:5173', 'http://192.168.1.16:5174',  'https://rento.indyside.com', 'http://localhost:3001', 'http://localhost:5173', 'https://rent-moto-admin.vercel.app', 'https://rent-moto-admin-react.vercel.app'] })
  );
  app.use((req, res, next) => {
    //res.header("Access-Control-Allow-Origin",process.env.BASE_URL);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });
  // test api
  app.get("/", (req, res) => {
    res.send("Hi there, Welcome to rent Moto");
  });

  app.get("/test", (req, res) => {
    res.send("Hi Shivram, Welcome to rent Moto");
  });
  // use routes
  app.use(onboardingRouters);

  const stripe = require("stripe")(
    "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"
  );

  app.post("/charge", async (req, res) => {
    const amount = req.body.amount;
    const token = req.body.token;
    const charge = await stripe.charges.create({
      amount: amount,
      currency: "USD",
      source: token.id,
      description: "Example charge",
    });
    res.json({ success: true, charge: charge });
  });

  // database connection
  mongoose
    .connect(process.env.DB_URL)
    .then(() => console.log("mongo db is connected....", process.env.DB_URL))
    .catch((err) => console.log("error occurs while connecting time", err));

  io.on("connection", async (socket) => {
    socket.on("typing", (o) => {
      socket.in(o.id).emit("typing", o.name)
    });
    socket.on("stop typing", (id) => {
      console.log(socket.id)
      socket.in(id).emit("stop typing")
    });
    socket.on("sendMessage", (o) => {
      socket.in(o.id).emit("sendMessage", o.msg)
    });
    socket.on('disconnectCall', (id) => {
      console.log('Disconnecting the call...');
      socket.in(id).emit("endCall")
    });
    socket.emit('connection', null);
    socket.on('disconnect', async () => {
      const find = peers.find(peer => peer.socketId === socket.id)
      if (find) {
        logs(`offline user socket id ${JSON.stringify(find)}`)
        //peers = peers.filter(peer => peer.socketId !== find.socketId)
        //logs(`newtwork gone ${JSON.stringify(peers)}`)
      }
    });
  })
};

startServer();
