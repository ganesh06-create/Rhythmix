const express = require("express");
const path = require("path");

const app = express();

const songApi = require("./backend/song");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Router
app.use("/api", songApi);
app.use("/songs", express.static(path.join(__dirname, "database/songs")));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
    res.render("index",
        { page: "home.ejs" }
    );
});

module.exports = app;