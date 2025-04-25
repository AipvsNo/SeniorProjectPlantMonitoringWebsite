const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
// for loading environment variables from a .env file into process.env.
const dotenv = require("dotenv").config();
const { initWebSocket } = require("./websocket");

const environmentRoutes = require("./routes/environmentRoutes");
const plantImageRoutes = require("./routes/plantImageRoutes");
const fanRoutes = require("./routes/fanRoutes");
const valveRoutes = require("./routes/valveRoutes");
const foggyRoutes = require("./routes/foggyRoutes");
const logRoutes = require("./routes/logRoutes");
const commandRoutes = require("./routes/commandRoutes"); // adjust path

const app = express();
// creates an HTTP server that uses your Express application (app) to handle standard REST API routes.
const server = http.createServer(app);
//  attaches a WebSocket server (wss) to the same HTTP server, meaning both HTTP (REST API) requests and WebSocket connections are handled on the same underlying server and port.

app.use(cors());
app.use(express.json());

// Routes
app.use("/environments", environmentRoutes);
app.use("/plant-images", plantImageRoutes);
app.use("/fans", fanRoutes);
app.use("/valves", valveRoutes);
app.use("/foggys", foggyRoutes);
app.use("/logs", logRoutes);
app.use("/commands", commandRoutes);

// Initialize the WebSocket server using the same HTTP server
initWebSocket(server);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.bgfyg.mongodb.net/plantique?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    console.log("CONNECTED TO MONGODB");
    server.listen(5000, "0.0.0.0", () => {
      console.log(`Backend is running on http://localhost:${5000}`);
    });
  })
  .catch((err) => {
    console.error("FAILED TO CONNECT TO MONGODB");
    console.error(err);
  });
