const express = require("express");
const cors = require("cors");
const xss = require("xss-clean");
const http = require("http");
const limit = require("express-rate-limit");
const Route = require("./routes/index");
const path = require("path");
const config = require("./defaultconfig.json");

const app = express();
const server = http.createServer(app);

// Configuration
const PORT = config.SERVER_PORT;

// Middleware configuration
app.use(express.json());
app.use(cors());
app.use(xss());
app.use("/usersdata", express.static(path.join(__dirname, "usersdata")));

// Rate limiting to prevent DDOS attacks
const limiter = limit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again after 1 hour.",
});

app.use(limiter);

// Routes
app.use(Route);

// Server configuration
server.keepAliveTimeout = 61 * 1000;
server.headersTimeout = 62 * 1000;

// Start the server
server.listen(PORT, () => {
  console.log(`Monify Server running on port ${PORT}`);
});
