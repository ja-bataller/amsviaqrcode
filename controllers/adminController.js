// Express NPM
const express = require("express");
// Express app
const app = express();

const { db } = require('../models/users');
const User = require('../models/users');

// Open admin view and show Data from MongoDB
module.exports.admin_get = (req,res) => {
    User.countDocuments({}, function (err, count) {
        let employees = count;
        console.log("Employees: " + employees);

        User.countDocuments({shift: "Day"}, function (err, count) {
            let day = count;
            console.log("Day Shift: " + day);
            
            User.countDocuments({shift: "Night"}, function (err, count) {
                let night = count;
                console.log("Night Shift: " + night);
                res.render("admin", {employees, day, night})
              });
          });
      });

    // User.countDocuments()
    // .then((count) => {
    //     res.render(locals,{employees: count});
    //    console.log(count);
    // })
    // .catch((err) => {
    //     console.log(err);
    // })
}

module.exports.logs_get = (req,res) => {res.render("logs");}

module.exports.users_get = (req,res) => {

    User.find()
    .then((result) => {
        res.render("users", {users: result})
    })
    .catch((err) => {
        console.log(err);
    })
}

module.exports.users_delete = ("/users/:id,", (req, res) => {
    const id = req.params.id;

    User.findByIdAndDelete(id)
    .then(result => {
        res.json({redirect: "/users"});
    })
    .catch(err => {
        console.log(err);
    })
}) 

module.exports.qrcodetester_get = (req,res) => {res.render("qrcodetester");}
module.exports.about_get = (req,res) => {res.render("about");}