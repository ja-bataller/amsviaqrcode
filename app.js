// Express NPM
const express = require("express");
// Mongoose
const mongoose = require("mongoose");
// Handlebars
const hbs = require("hbs");
//  Cookie parser
const cookieParser = require("cookie-parser");
// JWT
const jwt = require("jsonwebtoken");
const path = require('path');

// Express app
const app = express();
const Account = require("./models/accounts");

require('dotenv').config();
const DB_URI = process.env.MONGO_ATLAST_URI;

const PORT = process.env.PORT  || 3000;

// MongoDB Connection
mongoose.connect(DB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true})
    .then((result) => app.listen(PORT), console.log("Connected to MongoDB"))
    .catch((err) => console.log(err))

// Set static pages
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

// Handlebars View Engine
app.set("view engine", "hbs");
// Handlebars Partials
hbs.registerPartials(__dirname + "/views/partials");

hbs.registerHelper('select', function(selected, options) {
    return options.fn(this).replace(
        new RegExp(' value=\"' + selected + '\"'),
        '$& selected="selected"');
});

hbs.registerHelper('checked', function(value, test) {
    if (value == undefined) return '';
    return value==test ? 'checked' : '';
});

// Middleware
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use(authRoutes);
app.use(adminRoutes);


//  Get the Admins account in MongoDB
// app.get("/get-accounts", (req, res) => {
//     Account.find()
//     .then((result) => {
//         res.send(result);
//     })
//     .catch((err) => {
//         console.log(err);
//     });
// })

// // Add an Admins account in MongoDB
// app.get("/add-account", (req, res) => {
//     const account = new Account({
//         username: "jdbt",
//         password: "jdbt",
//         name: "John Anthony Bataller",
//     });
//     account.save()
//     .then((result) => {
//         res.send({message: 'Account Created'});
//     })
//     .catch((err) => {
//         console.log(err);
//     })
// })


