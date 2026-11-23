const express = require("express");
const path = require("path");

const app = express();

const songApi = require("./backend/song");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Router
app.use("/api", songApi);

// Static files
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
    res.send("Hello");
});

module.exports = app;