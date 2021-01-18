// Express NPM
const express = require("express");
// Express app
const app = express();

const {
    db
} = require('../models/users');
const User = require('../models/users');
const Log = require('../models/logs');
const Record = require('../models/records');

// Open admin view and show Data from MongoDB
module.exports.admin_get = (req, res) => {
    User.countDocuments({}, function(err, count) {
        let employees = count;
        console.log("Employees: " + employees);

        User.countDocuments({
            shift: "day"
        }, function(err, count) {
            let day = count;
            console.log("Day Shift: " + day);

            User.countDocuments({
                shift: "night"
            }, function(err, count) {
                let night = count;
                console.log("Night Shift: " + night);
                Log.countDocuments({
                    status: "active"
                }, function(err, count) {
                    let active = count;
                    console.log("Status active: " + active);
                    Log.countDocuments({
                        status: "logged out"
                    }, function(err, count) {
                        let done = count;
                        console.log("Status done: " + done);
                        res.render("admin", {employees,day,night,active,done})
                    });
                });
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

module.exports.logs_get = (req, res) => {
    Log.find()
        .then((result) => {

            res.render("logs", {
                logs: result
            })
        })
        .catch((err) => {
            console.log(err);
        })
}

module.exports.records_get = (req, res) => {
    Record.find()
        .then((result) => {

            res.render("records", {
                records: result
            })
        })
        .catch((err) => {
            console.log(err);
        })
}

module.exports.users_get = (req, res) => {

    User.find()
        .then((result) => {

            result.map(user => {
                user.middlename = user.middlename != '' ? user.middlename : 'N/A';
            });

            res.render("users", {
                users: result
            })
        })
        .catch((err) => {
            console.log(err);
        })
}


module.exports.userview_get = (req, res) => {
    const id = req.params.id;
    console.log(id);

    User.findById(id)
        .then(result => {
            res.render("user_view", {
                user: result
            })
        })
        .catch(err => {
            console.log(err);
        })
}

module.exports.update_post = (req, res) => {
    const id = req.params.id;
    console.log(id);

    const user = new User(req.body);
    console.log(user);

    User.findByIdAndUpdate(id, {
            firstname: user.firstname,
            middlename: user.middlename,
            lastname: user.lastname,
            gender: user.gender,
            age: user.age,
            birthdate: user.birthdate,
            contact_number: user.contact_number,
            email_address: user.email_address,
            home_address: user.home_address,
            department: user.department,
            shift: user.shift
        })
        .then((result) => {
            res.redirect("/users");
        })
        .catch((err) => {
            console.log(err);
        })
}

module.exports.users_delete = (req, res) => {
    const id = req.params.id;
    console.log(id);
    User.findByIdAndDelete(id)
        .then(result => {
            res.json({
                redirect: "/users",
                message: "User has been deleted successfully"
            });
        })
        .catch(err => {
            console.log(err);
        })
}

module.exports.qrcodetester_get = (req, res) => {
    res.render("qrcodetester");
}
module.exports.about_get = (req, res) => {
    res.render("about");
}