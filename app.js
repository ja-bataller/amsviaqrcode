const express = require("express");
const hbs = require("hbs");
const path = require('path');

// express app
const app = express();

// Set static pages
const publicDirectory = path.join(__dirname, './public/');
app.use(express.static(publicDirectory));

// Template Engine
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials");

// listen for requests
app.listen(3000);

// views index
app.get("/", (req, res) => {
    res.render("index");
});

// views admin
app.get("/admin", (req, res) => {
    res.render("admin");
});

// views logs
app.get("/logs", (req, res) => {
    res.render("logs");
});

// views users
app.get("/users", (req, res) => {
    res.render("users");
});

// views qr code tester
app.get("/qrcodetester", (req, res) => {
    res.render("qrcodetester");
});

// views register user
app.get("/register", (req, res) => {
    res.render("registeruser");
});

// views qr code generator
app.get("/qrcode", (req, res) => {
    res.render("qrcodegenerator");
});

// views about
app.get("/about", (req, res) => {
    res.render("about");
});